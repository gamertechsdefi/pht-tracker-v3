import { NextRequest, NextResponse } from 'next/server';
import { processAllTokens, calculateBurnData, getCachedBurnData } from '@/lib/cron-burn-service';

// Verify the request is from a legitimate cron service or has proper authentication
function isAuthorizedRequest(req: NextRequest): boolean {
  // Check for cron service headers (Vercel Cron, etc.)
  const userAgent = req.headers.get('user-agent') || '';
  const isCronService = userAgent.includes('cron') || 
                       userAgent.includes('vercel') ||
                       userAgent.includes('github');

  // Check for authorization header (you can set this in your cron service)
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (expectedToken && authHeader === `Bearer ${expectedToken}`) {
    return true;
  }

  // Allow cron services
  if (isCronService) {
    return true;
  }

  // For development, allow local requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authorization
    if (!isAuthorizedRequest(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if we should process all tokens or just one
    const { searchParams } = new URL(req.url);
    const tokenName = searchParams.get('token');
    const force = searchParams.get('force') === 'true';

    if (tokenName) {
      // Process single token
      console.log(`Processing single token: ${tokenName}`);
      
      // Check if we need to update (unless forced)
      if (!force) {
        const cachedData = await getCachedBurnData(tokenName);
        if (cachedData) {
          const nextUpdate = new Date(cachedData.nextUpdate);
          const now = new Date();
          
          if (now < nextUpdate) {
            return NextResponse.json({
              message: `Token ${tokenName} is up to date`,
              nextUpdate: cachedData.nextUpdate,
              data: cachedData
            });
          }
        }
      }

      const burnData = await calculateBurnData(tokenName);
      
      if (burnData) {
        return NextResponse.json({
          message: `Successfully updated burn data for ${tokenName}`,
          data: burnData
        });
      } else {
        return NextResponse.json(
          { error: `Failed to calculate burn data for ${tokenName}` },
          { status: 500 }
        );
      }
    } else {
      // Process all tokens
      console.log('Processing all tokens...');
      await processAllTokens();
      
      return NextResponse.json({
        message: 'Successfully updated burn data for all tokens',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update burn data',
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that prefer POST
export async function POST(req: NextRequest): Promise<NextResponse> {
  return GET(req);
} 