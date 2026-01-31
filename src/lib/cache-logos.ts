import { redis } from './redis';
import { TOKEN_REGISTRY } from './tokenRegistry';

/**
 * Cache all token logos in Redis
 * This can be run as a cron job or manually to warm up the cache
 */
export async function cacheAllLogos() {
  console.log('Starting logo caching process...');
  let foundCount = 0;
  let missingCount = 0;
  let skipCount = 0;

  const imageKitUrl = process.env.IMAGE_KIT_URL || 'https://ik.imagekit.io/5j6l15rnd';
  const fileExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  for (const token of TOKEN_REGISTRY) {
    const { address, chain, symbol } = token;
    const redisKey = `logo:${chain}:${address.toLowerCase()}`;

    try {
      // Check if already cached
      try {
        const cached = await redis.get(redisKey);
        if (cached) {
          console.log(`✓ Already cached: ${symbol} (${chain})`);
          skipCount++;
          // Optional: uncomment to force refresh
          // continue; 
        }
      } catch (e) {
        // ignore redis get error
      }

      // Try to fetch the logo from ImageKit
      let buffer: Buffer | null = null;
      let contentType = 'image/png';

      const addressVariants = [address, address.toLowerCase()];
      // Deduplicate variants
      const uniqueVariants = [...new Set(addressVariants)];

      for (const addressVariant of uniqueVariants) {
        for (const ext of fileExtensions) {
          const imageUrl = `${imageKitUrl}/${chain}/${addressVariant}${ext}`;

          try {
            const response = await fetch(imageUrl, { method: 'GET' });

            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
              contentType = response.headers.get('content-type') || 'image/png';
              break;
            }
          } catch (e) {
            // continue
          }
        }
        if (buffer) break;
      }

      if (buffer) {
        // Store in Redis (TTL: 7 days)
        try {
          const base64Buffer = buffer.toString('base64');
          await redis.setex(redisKey, 604800, {
            buffer: base64Buffer,
            contentType: contentType,
          });
          console.log(`✓ Found in ImageKit: ${symbol} (${chain}) - ${buffer.length} bytes`);
          foundCount++;
        } catch (error) {
          console.error(`✗ Error caching ${symbol} (${chain}):`, error);
        }
      } else {
        console.log(`✗ Missing in ImageKit: ${symbol} (${chain})`);
        missingCount++;
      }
    } catch (error) {
      console.error(`✗ Error checking ${symbol} (${chain}):`, error);
      missingCount++;
    }
  }

  console.log('\n=== ImageKit Cache Check Complete ===');
  console.log(`✓ Found/Cached: ${foundCount}`);
  console.log(`→ Skipped (Already Cached): ${skipCount}`);
  console.log(`✗ Missing: ${missingCount}`);
  console.log(`Total tokens: ${TOKEN_REGISTRY.length}`);

  return {
    found: foundCount,
    skipped: skipCount,
    missing: missingCount,
    total: TOKEN_REGISTRY.length,
  };
}

/**
 * Clear all logo cache entries
 */
export async function clearLogoCache() {
  console.log('Clearing logo cache...');
  let count = 0;

  for (const token of TOKEN_REGISTRY) {
    const { address, chain } = token;
    const redisKey = `logo:${chain}:${address.toLowerCase()}`;

    try {
      await redis.del(redisKey);
      count++;
    } catch (error) {
      console.error(`Error deleting ${redisKey}:`, error);
    }
  }

  console.log(`Cleared ${count} cache entries`);
  return count;
}

/**
 * Get cache statistics
 */
export async function getLogoCacheStats() {
  let cachedCount = 0;
  let uncachedCount = 0;

  for (const token of TOKEN_REGISTRY) {
    const { address, chain } = token;
    const redisKey = `logo:${chain}:${address.toLowerCase()}`;

    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        cachedCount++;
      } else {
        uncachedCount++;
      }
    } catch (error) {
      console.error(`Error checking ${redisKey}:`, error);
      uncachedCount++;
    }
  }

  return {
    total: TOKEN_REGISTRY.length,
    cached: cachedCount,
    uncached: uncachedCount,
    cacheRate: ((cachedCount / TOKEN_REGISTRY.length) * 100).toFixed(2) + '%',
  };
}

