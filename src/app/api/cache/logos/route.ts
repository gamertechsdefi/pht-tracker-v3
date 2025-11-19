import { NextRequest, NextResponse } from 'next/server';
import { cacheAllLogos, clearLogoCache, getLogoCacheStats } from '@/lib/cache-logos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await getLogoCacheStats();
        return NextResponse.json(stats, { status: 200 });

      case 'warm':
        // Warm up the cache by caching all logos
        const result = await cacheAllLogos();
        return NextResponse.json({
          message: 'Cache warming complete',
          ...result,
        }, { status: 200 });

      case 'clear':
        const cleared = await clearLogoCache();
        return NextResponse.json({
          message: 'Cache cleared',
          cleared,
        }, { status: 200 });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use ?action=stats, ?action=warm, or ?action=clear',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage cache' },
      { status: 500 }
    );
  }
}
