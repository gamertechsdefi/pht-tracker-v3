import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";

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

    const chainLower = chain.toLowerCase() as 'bsc' | 'sol';
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

    // Use the contract address to find the logo file (files are now named by contract address)
    const contractAddress = tokenMetadata.address;
    const fileExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    let filePath: string | null = null;

    // Check for file with any of the supported extensions using contract address
    // Try both original case and lowercase versions
    const addressVariants = [contractAddress, contractAddress.toLowerCase()];

    for (const addressVariant of addressVariants) {
      for (const ext of fileExtensions) {
        const potentialPath = join(process.cwd(), "public", "images", chainLower, "token-logos", `${addressVariant}${ext}`);
        if (existsSync(potentialPath)) {
          filePath = potentialPath;
          break;
        }
      }
      if (filePath) break;
    }

    // Fallback: try with symbol for backward compatibility
    if (!filePath) {
      const tokenSymbol = tokenMetadata.symbol.toLowerCase();
      for (const ext of fileExtensions) {
        const potentialPath = join(process.cwd(), "public", "images", chainLower, "token-logos", `${tokenSymbol}${ext}`);
        if (existsSync(potentialPath)) {
          filePath = potentialPath;
          break;
        }
      }
    }

    // If no file is found, return a 404 response
    if (!filePath) {
      return NextResponse.json({ error: "Logo not found for this token" }, { status: 404 });
    }

    // Read the file and determine its content type
    const fileBuffer = readFileSync(filePath);
    const contentType = filePath.endsWith(".png") ? "image/png" :
                        filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" :
                        filePath.endsWith(".webp") ? "image/webp" : "application/octet-stream";

    // Return the image as a response
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
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
