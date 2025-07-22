// app/api/burn/background/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { BurnService } from '@/lib/services/burnService';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tokenName, intervals } = await request.json();
    
    if (!tokenName || !intervals || !Array.isArray(intervals)) {
      return NextResponse.json(
        { error: "tokenName and intervals array are required" },
        { status: 400 }
      );
    }

    const burnService = new BurnService();
    
    // Process the background job
    await burnService.processBackgroundJob(tokenName, intervals);
    
    return NextResponse.json({
      success: true,
      message: `Background job completed for ${tokenName}`,
      intervals,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Background job error:", error);
    
    return NextResponse.json(
      {
        error: "Background job failed",
        message: (error as Error).message,
        success: false
      },
      { status: 500 }
    );
  }
}