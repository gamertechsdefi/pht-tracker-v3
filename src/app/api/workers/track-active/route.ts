import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

/**
 * Track active tokens being viewed
 * This helps prioritize which tokens to refresh in background
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAddress, chain } = body;

    if (!tokenAddress || !chain) {
      return NextResponse.json(
        { error: 'tokenAddress and chain are required' },
        { status: 400 }
      );
    }

    // Add to active tokens set
    const activeKey = 'active-tokens';
    const tokenKey = `${chain}:${tokenAddress.toLowerCase()}`;
    
    // Use Redis SET to track active tokens with timestamp
    await redis.zadd(activeKey, {
      score: Date.now(),
      member: tokenKey,
    });

    // Set TTL to remove inactive tokens after 5 minutes
    await redis.expire(activeKey, 300);

    return NextResponse.json({
      success: true,
      message: 'Token tracked',
    });
  } catch (error) {
    console.error('Error tracking active token:', error);
    return NextResponse.json(
      { error: 'Failed to track token' },
      { status: 500 }
    );
  }
}

/**
 * Get list of active tokens
 */
export async function GET() {
  try {
    const activeKey = 'active-tokens';
    
    // Get all active tokens with their scores
    const activeTokens = await redis.zrange(activeKey, 0, -1, { withScores: true });

    // Filter tokens accessed in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentTokens: string[] = [];
    
    if (Array.isArray(activeTokens)) {
      for (let i = 0; i < activeTokens.length; i += 2) {
        const token = activeTokens[i];
        const score = activeTokens[i + 1];
        if (typeof score === 'number' && score >= fiveMinutesAgo) {
          recentTokens.push(token as string);
        }
      }
    }

    return NextResponse.json({
      activeTokens: recentTokens,
      count: recentTokens.length,
    });
  } catch (error) {
    console.error('Error getting active tokens:', error);
    return NextResponse.json(
      { error: 'Failed to get active tokens' },
      { status: 500 }
    );
  }
}
