
import { NextResponse } from 'next/server';
import { getTokenData, TOKEN_MAP } from '../../../lib/dexscreener';

export async function GET() {
  const tokens = Object.keys(TOKEN_MAP);
  const tokenData = [];

  for (const token of tokens) {
    const data = await getTokenData(token);
    if (data) {
      tokenData.push({
        symbol: token,
        price: data.price,
        marketCap: data.marketCap,
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Add a 1-second delay
  }

  tokenData.sort((a, b) => {
    const marketCapA = parseFloat(String(a.marketCap).replace(/[^0-9.-]+/g,"")) || 0;
    const marketCapB = parseFloat(String(b.marketCap).replace(/[^0-9.-]+/g,"")) || 0;
    return marketCapB - marketCapA;
  });

  return NextResponse.json(tokenData);
}
