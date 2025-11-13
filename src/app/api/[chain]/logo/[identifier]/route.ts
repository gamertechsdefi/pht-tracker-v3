import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";
import { downloadFile, getContentType } from "@/lib/supabase";
import { readFile } from "fs/promises";
import { join } from "path";

interface RouteParams {
  chain: string;
  identifier: string;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { chain, identifier } = params;
    
    if (!chain || !identifier) {
      return NextResponse.json({ error: 'Missing chain or identifier' }, { status: 400 });
    }

    const chainLower = chain.toLowerCase() as 'bsc' | 'sol' | 'rwa';
    const identifierLower = identifier.toLowerCase();
    
    // Determine if identifier is a contract address or symbol
    let tokenMetadata;
    
    if (isValidContractAddress(identifierLower, chainLower)) {
      // It's a contract address
      tokenMetadata = getTokenByAddress(identifierLower);
    } else {
      // It's a symbol - specify chain to avoid conflicts with duplicate symbols
      tokenMetadata = getTokenBySymbol(identifierLower, chainLower);
    }

    if (!tokenMetadata) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Verify chain matches
    if (tokenMetadata.chain !== chainLower) {
      return NextResponse.json({ 
        error: `Token is on ${tokenMetadata.chain.toUpperCase()}, not ${chainLower.toUpperCase()}` 
      }, { status: 400 });
    }

    // Use the contract address to find the logo file in Supabase storage
    const contractAddress = tokenMetadata.address;
    const fileExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    let fileBuffer: Buffer | null = null;
    let contentType = "image/png";
    let foundFilename = "";

    // Check for file with any of the supported extensions using contract address
    // Try both original case and lowercase versions
    const addressVariants = [contractAddress, contractAddress.toLowerCase()];

    for (const addressVariant of addressVariants) {
      for (const ext of fileExtensions) {
        const filename = `${addressVariant}${ext}`;
        const storagePath = `images/${chainLower}/${filename}`;
        
        console.log(`Trying Supabase path: ${storagePath}`);
        fileBuffer = await downloadFile('images', `${chainLower}/${filename}`);
        
        if (fileBuffer) {
          foundFilename = filename;
          contentType = getContentType(filename);
          break;
        }
      }
      if (fileBuffer) break;
    }

    // Fallback: try with symbol for backward compatibility
    if (!fileBuffer) {
      const tokenSymbol = tokenMetadata.symbol.toLowerCase();
      for (const ext of fileExtensions) {
        const filename = `${tokenSymbol}${ext}`;
        const storagePath = `images/${chainLower}/${filename}`;
        
        console.log(`Trying Supabase path (symbol fallback): ${storagePath}`);
        fileBuffer = await downloadFile('images', `${chainLower}/${filename}`);
        
        if (fileBuffer) {
          foundFilename = filename;
          contentType = getContentType(filename);
          break;
        }
      }
    }

    // Fallback: Check local public directory if not found in Supabase
    if (!fileBuffer) {
      console.log(`Logo not found in Supabase, checking local files...`);
      
      for (const addressVariant of addressVariants) {
        for (const ext of fileExtensions) {
          try {
            const filename = `${addressVariant}${ext}`;
            const localPath = join(process.cwd(), 'public', 'images', chainLower, 'token-logos', filename);
            
            console.log(`Trying local path: ${localPath}`);
            const localBuffer = await readFile(localPath);
            
            if (localBuffer) {
              fileBuffer = localBuffer;
              foundFilename = filename;
              contentType = getContentType(filename);
              console.log(`Found logo in local files: ${filename}`);
              break;
            }
          } catch {
            // File doesn't exist locally, continue
          }
        }
        if (fileBuffer) break;
      }
    }

    // If no file is found anywhere, return a 404 response
    if (!fileBuffer) {
      console.log(`Logo not found for token ${contractAddress} on chain ${chainLower}`);
      return NextResponse.json({ error: "Logo not found for this token" }, { status: 404 });
    }

    console.log(`Found logo: ${foundFilename} (${fileBuffer.length} bytes)`);

    // Return the image as a response
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Content-Length": fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Logo API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}
