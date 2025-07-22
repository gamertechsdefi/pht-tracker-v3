// app/api/cron/burn-update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BurnService } from '@/lib/burnService';

// Define token groups and their update intervals
const TOKEN_MAP = {
  pht: "PHT",
  wkc: "WKC", 
  war: "WAR",
  dtg: "DTG",
  yukan: "YUKAN",
  btcdragon: "BTCDRAGON",
  ocicat: "OCICAT",
  nene: "NENE",
  twc: "TWC",
  tkc: "TKC",
  durt: "DURT",
  twd: "TWD",
  gtan: "GTAN",
  zedek: "ZEDEK",
  bengcat: "BENGCAT",
  bcat: "BCAT",
  nct: "NCT",
  kitsune: "KITSUNE",
  crystalstones: "CRYSTALSTONES",
  bft: "BFT",
  cross: "CROSS",
  thc: "THC",
  bbft: "BBFT",
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify the request is from a cron job (basic security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const burnService = new BurnService();
    const url = new URL(request.url);
    const interval = url.searchParams.get('interval');
    
    if (!interval) {
      return NextResponse.json(
        { error: "interval parameter is required" },
        { status: 400 }
      );
    }

    // Define which intervals to update based on the cron job
    const intervalMap: Record<string, string[]> = {
      'short': ['5min', '15min'], // Run every 5 minutes
      'medium': ['30min', '1h'],  // Run every 30 minutes
      'long': ['3h', '6h', '12h', '24h'] // Run every hour
    };

    const intervalsToUpdate = intervalMap[interval];
    if (!intervalsToUpdate) {
      return NextResponse.json(
        { error: `Invalid interval: ${interval}` },
        { status: 400 }
      );
    }

    const results = [];
    const tokens = Object.keys(TOKEN_MAP);
    
    // Process tokens in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (tokenName) => {
        try {
          await burnService.processBackgroundJob(tokenName, intervalsToUpdate);
          return { tokenName, status: 'success' };
        } catch (error) {
          console.error(`Error processing ${tokenName}:`, error);
          return { 
            tokenName, 
            status: 'error', 
            error: (error as Error).message 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Cron job completed for ${interval} intervals`,
      processed: results.length,
      successful: successCount,
      errors: errorCount,
      interval,
      intervalsUpdated: intervalsToUpdate,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Cron job error:", error);
    
    return NextResponse.json(
      {
        error: "Cron job failed",
        message: (error as Error).message,
        success: false
      },
      { status: 500 }
    );
  }
}