import { redis } from './redis';
import { TOKEN_REGISTRY } from './tokenRegistry';
import { downloadFile, getContentType } from './supabase';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Cache all token logos in Redis
 * This can be run as a cron job or manually to warm up the cache
 */
export async function cacheAllLogos() {
  console.log('Starting logo caching process...');
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const token of TOKEN_REGISTRY) {
    const { address, chain, symbol } = token;
    const redisKey = `logo:${chain}:${address.toLowerCase()}`;

    try {
      // Check if already cached
      const cached = await redis.get(redisKey);
      if (cached) {
        console.log(`✓ Already cached: ${symbol} (${chain})`);
        skipCount++;
        continue;
      }

      // Try to fetch the logo
      let fileBuffer: Buffer | null = null;
      let contentType = 'image/png';
      const fileExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      const addressVariants = [address, address.toLowerCase()];

      // Try Supabase first
      for (const addressVariant of addressVariants) {
        for (const ext of fileExtensions) {
          const filename = `${addressVariant}${ext}`;
          fileBuffer = await downloadFile('images', `${chain}/${filename}`);
          
          if (fileBuffer) {
            contentType = getContentType(filename);
            break;
          }
        }
        if (fileBuffer) break;
      }

      // Try local files if not in Supabase
      if (!fileBuffer) {
        for (const addressVariant of addressVariants) {
          for (const ext of fileExtensions) {
            try {
              const filename = `${addressVariant}${ext}`;
              const localPath = join(process.cwd(), 'public', 'images', chain, 'token-logos', filename);
              fileBuffer = await readFile(localPath);
              
              if (fileBuffer) {
                contentType = getContentType(filename);
                break;
              }
            } catch {
              // Continue to next variant
            }
          }
          if (fileBuffer) break;
        }
      }

      if (fileBuffer) {
        // Store in Redis (TTL: 7 days)
        const base64Buffer = fileBuffer.toString('base64');
        await redis.setex(redisKey, 604800, {
          buffer: base64Buffer,
          contentType: contentType,
        });
        console.log(`✓ Cached: ${symbol} (${chain}) - ${fileBuffer.length} bytes`);
        successCount++;
      } else {
        console.log(`✗ Not found: ${symbol} (${chain})`);
        failCount++;
      }
    } catch (error) {
      console.error(`✗ Error caching ${symbol} (${chain}):`, error);
      failCount++;
    }
  }

  console.log('\n=== Caching Complete ===');
  console.log(`✓ Cached: ${successCount}`);
  console.log(`⊘ Skipped (already cached): ${skipCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`Total tokens: ${TOKEN_REGISTRY.length}`);

  return {
    success: successCount,
    skipped: skipCount,
    failed: failCount,
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
