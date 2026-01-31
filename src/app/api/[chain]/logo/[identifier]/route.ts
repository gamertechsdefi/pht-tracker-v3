import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";
import { redis } from "@/lib/redis";

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

    // ImageKit configuration
    const imageKitUrl = process.env.IMAGE_KIT_URL || 'https://ik.imagekit.io/5j6l15rnd';
    const fileExtensions = [".png", ".jpg", ".jpeg", ".webp"];

    // Try both checksummed and lowercase address variants
    const addressVariants = [contractAddress, contractAddress.toLowerCase()];
    // Deduplicate variants
    const uniqueVariants = [...new Set(addressVariants)];

    for (const addressVariant of uniqueVariants) {
      for (const ext of fileExtensions) {
        const imageUrl = `${imageKitUrl}/${chainLower}/${addressVariant}${ext}`;

        try {
          // Fetch image from ImageKit
          const response = await fetch(imageUrl, {
            method: 'GET',
            // cache: 'no-store' // Ensure we get fresh content if needed, though usually default is fine
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/png';

            console.log(`Found logo at: ${imageUrl}`);

            return new NextResponse(buffer as unknown as BodyInit, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Surrogate-Control": "no-store",
                "Content-Length": buffer.length.toString(),
                "X-Cache": "MISS", // Indicating it was fetched from upstream
              },
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${imageUrl}:`, error);
          // Continue to next variant/extension
        }
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