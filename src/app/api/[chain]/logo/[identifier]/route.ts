import { NextRequest, NextResponse } from "next/server";
import { getCldImageUrl } from 'next-cloudinary';
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";
import { redis } from "@/lib/redis";
import path from 'path';
import fs from 'fs';

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

    const contractAddress = tokenMetadata.address;

    const fileExtensions = [".png", ".jpg", ".jpeg", ".webp"];

    // Try both checksummed and lowercase address variants
    const addressVariants = [contractAddress, contractAddress.toLowerCase()];
    // Deduplicate variants
    const uniqueVariants = [...new Set(addressVariants)];

    for (const addressVariant of uniqueVariants) {
      for (const ext of fileExtensions) {
        // 1. Try fetching from local public folder
        const localFilePath = path.join(process.cwd(), 'public', 'images', chainLower, 'token-logos', `${addressVariant}${ext}`);

        if (fs.existsSync(localFilePath)) {
          console.log(`Found local logo at: ${localFilePath}`);
          const fileBuffer = fs.readFileSync(localFilePath);
          const contentType = ext === '.png' ? 'image/png' :
            ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
              ext === '.webp' ? 'image/webp' : 'application/octet-stream';

          return new NextResponse(fileBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, must-revalidate",
              "Content-Length": fileBuffer.length.toString(),
              "X-Cache": "HIT",
            },
          });
        }

        // 2. Try fetching from Cloudinary (Commented out)
        /*
        // format: remove the dot
        const format = ext.replace('.', '');

        const cloudinaryUrl = getCldImageUrl({
          src: `${chainLower}/${addressVariant}${ext}`,  
          
        });

        try {
          const response = await fetch(cloudinaryUrl, { method: 'GET' });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/png';

            console.log(`Found logo at: ${cloudinaryUrl}`);

            return new NextResponse(buffer as unknown as BodyInit, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, must-revalidate",
                "Content-Length": buffer.length.toString(),
                "X-Cache": "HIT",
              },
            });
          }
        } catch (error) {
          console.warn(`Error processing ${cloudinaryUrl}:`, error);
        }
        */
      }
    }

    console.log(`Logo not found for token ${contractAddress} on chain ${chainLower}`);
    return NextResponse.json({ error: "Logo not found for this token" }, { status: 404 });

  } catch (error) {
    console.error('Logo API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}