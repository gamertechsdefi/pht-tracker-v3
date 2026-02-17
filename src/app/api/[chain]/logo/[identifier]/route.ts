import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Global cache (persists during development hot reloads)
const globalForCache = global as unknown as {
  logoCache: Map<string, { buffer: ArrayBuffer; contentType: string; expiry: number }>;
};

if (!globalForCache.logoCache) {
  globalForCache.logoCache = new Map();
}

const localCache = globalForCache.logoCache;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getLogoBuffer(chain: string, address: string) {
  const cacheKey = `logo:${chain}:${address.toLowerCase()}`;
  const now = Date.now();

  // 1. Server in-memory cache hit
  const cached = localCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    console.log(`[CACHE HIT] ${chain}/${address}`);
    return cached;
  }

  // 2. Search latest image on Cloudinary
  try {
    const result = await cloudinary.search
      .expression(`folder:${chain} AND public_id:${chain}/${address}_*`)
      .sort_by('created_at', 'desc')
      .max_results(1)
      .execute();

    if (result.resources?.length > 0) {
      const imageUrl = result.resources[0].secure_url;

      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image`);

      const contentType = res.headers.get('content-type') || 'image/png';
      const buffer = await res.arrayBuffer();

      // Cache it
      localCache.set(cacheKey, {
        buffer,
        contentType,
        expiry: now + CACHE_TTL,
      });

      console.log(`[CACHE MISS] Fetched & cached ${chain}/${address}`);
      return { buffer, contentType };
    }
  } catch (err) {
    console.error("Cloudinary logo fetch error:", err);
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ chain: string; identifier: string }> }
) {
  try {
    const { chain, identifier } = await context.params;

    if (!chain || !identifier) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const chainLower = chain.toLowerCase() as 'bsc' | 'sol' | 'rwa';
    const identifierLower = identifier.toLowerCase();

    let tokenMetadata = null;

    if (isValidContractAddress(identifierLower, chainLower)) {
      tokenMetadata = getTokenByAddress(identifierLower);
    } else {
      tokenMetadata = getTokenBySymbol(identifierLower, chainLower);
    }

    if (!tokenMetadata) {
      if (!isValidContractAddress(identifierLower, chainLower)) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
      }
    } else if (tokenMetadata.chain !== chainLower) {
      return NextResponse.json(
        { error: `Token exists on ${tokenMetadata.chain.toUpperCase()}` },
        { status: 400 }
      );
    }

    const contractAddress = tokenMetadata?.address ?? identifierLower;

    const logoData = await getLogoBuffer(chainLower, contractAddress);

    if (logoData) {
      return new NextResponse(logoData.buffer, {
        headers: {
          "Content-Type": logoData.contentType,
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }

    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  } catch (error) {
    console.error("Logo API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}