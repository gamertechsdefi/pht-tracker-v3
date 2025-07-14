import { NextRequest, NextResponse } from 'next/server';
import { calculateBurnData, saveBurnDataToFirebase } from '@/lib/cron-burn-service';

export async function POST(req: NextRequest, { params }: { params: { tokenName: string } }) {
  const tokenName = params.tokenName?.toLowerCase();
  if (!tokenName) {
    return NextResponse.json({ error: 'Missing tokenName' }, { status: 400 });
  }

  try {
    const burnData = await calculateBurnData(tokenName);
    if (burnData) {
      await saveBurnDataToFirebase(tokenName, burnData);
      return NextResponse.json({ message: 'Burn data calculated and cached', data: burnData });
    } else {
      return NextResponse.json({ error: 'Failed to calculate burn data' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: { tokenName: string } }) {
  // Allow GET for manual testing
  return POST(req, ctx);
} 