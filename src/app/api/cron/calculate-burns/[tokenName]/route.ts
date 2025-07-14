import { NextRequest, NextResponse } from 'next/server';
import { calculateBurnData, saveBurnDataToFirebase } from '@/lib/cron-burn-service';

export async function POST(req: NextRequest) {
  try {
    const tokenName = req.nextUrl.pathname.split('/').pop()?.toLowerCase();
    if (!tokenName) {
      return NextResponse.json({ error: 'Missing tokenName' }, { status: 400 });
    }

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

export async function GET(req: NextRequest) {
  try {
    const tokenName = req.nextUrl.pathname.split('/').pop()?.toLowerCase();
    if (!tokenName) {
      return NextResponse.json({ error: 'Missing tokenName' }, { status: 400 });
    }

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