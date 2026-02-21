import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CacheHit = { buffer: ArrayBuffer; contentType: string; expiry: number };
type CacheMiss = { notFound: true; expiry: number };
type CacheEntry = CacheHit | CacheMiss;

const globalForCache = global as unknown as {
  logoCache: Map<string, CacheEntry>;
};

if (!globalForCache.logoCache) {
  globalForCache.logoCache = new Map();
}

const localCache = globalForCache.logoCache;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for successful fetches
const NOT_FOUND_TTL = 10 * 60 * 1000; // 10 min for not-found (allows retry when new images are added)

function isCacheHit(entry: CacheEntry): entry is CacheHit {
  return "buffer" in entry;
}

async function fetchFromCloudinary(
  chain: string,
  address: string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const normalizedAddr = address.toLowerCase();
  const publicIdPrefix = `${chain}/${normalizedAddr}`;

  // Strategy 1: Search Cloudinary for versioned public_id (e.g. bsc/0x123_v123)
  try {
    const result = await cloudinary.search
      .expression(`folder:${chain} AND public_id:${publicIdPrefix}_*`)
      .sort_by("created_at", "desc")
      .max_results(1)
      .execute();

    if (result.resources?.length > 0) {
      const imageUrl = result.resources[0].secure_url;
      const res = await fetch(imageUrl);
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/png";
        const buffer = await res.arrayBuffer();
        return { buffer, contentType };
      }
    }
  } catch (err) {
    console.warn(`[Cloudinary] Search failed for ${publicIdPrefix}:`, err);
  }

  // Strategy 2: Search for exact public_id (e.g. bsc/0x123, no version suffix)
  try {
    const result = await cloudinary.search
      .expression(`folder:${chain} AND public_id:${publicIdPrefix}`)
      .max_results(1)
      .execute();

    if (result.resources?.length > 0) {
      const imageUrl = result.resources[0].secure_url;
      const res = await fetch(imageUrl);
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/png";
        const buffer = await res.arrayBuffer();
        return { buffer, contentType };
      }
    }
  } catch (err) {
    console.warn(`[Cloudinary] Exact search failed for ${publicIdPrefix}:`, err);
  }

  // Strategy 3: Try direct delivery URL (works if asset exists with predictable path)
  if (cloudName) {
    for (const ext of ["png", "jpg", "jpeg", "webp"]) {
      const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicIdPrefix}.${ext}`;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          const fullRes = await fetch(url);
          if (fullRes.ok) {
            const contentType = fullRes.headers.get("content-type") || `image/${ext}`;
            const buffer = await fullRes.arrayBuffer();
            return { buffer, contentType };
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

async function getLogoBuffer(chain: string, address: string): Promise<CacheHit | null> {
  const cacheKey = `logo:${chain}:${address.toLowerCase()}`;
  const now = Date.now();

  const cached = localCache.get(cacheKey);
  if (cached) {
    if (cached.expiry > now) {
      if (isCacheHit(cached)) {
        console.log(`[CACHE HIT] ${chain}/${address}`);
        return cached;
      }
      // Cached "not found" still valid - don't hit Cloudinary
      console.log(`[CACHE HIT] not-found ${chain}/${address} (retry in ${Math.round((cached.expiry - now) / 60000)}m)`);
      return null;
    }
    // Expired - remove so we can retry Cloudinary (new images may have been added)
    localCache.delete(cacheKey);
  }

  // Not in cache or expired: request individually from Cloudinary
  const fetched = await fetchFromCloudinary(chain, address);

  if (fetched) {
    const entry: CacheHit = {
      buffer: fetched.buffer,
      contentType: fetched.contentType,
      expiry: now + CACHE_TTL,
    };
    localCache.set(cacheKey, entry);
    console.log(`[CACHE MISS] Fetched & stored ${chain}/${address} from Cloudinary`);
    return entry;
  }

  // Not found: cache with short TTL so we retry when new images are added
  localCache.set(cacheKey, {
    notFound: true,
    expiry: now + NOT_FOUND_TTL,
  });
  console.log(`[CACHE MISS] Not found ${chain}/${address}, will retry in ${NOT_FOUND_TTL / 60000}m`);
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