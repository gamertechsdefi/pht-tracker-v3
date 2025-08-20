import { NextResponse } from 'next/server';
import { getTokenData, TOKEN_MAP } from '../../../lib/dexscreener';

export async function GET() {
  const tokens = Object.keys(TOKEN_MAP);

  const tokenDataPromises = tokens.map(token => getTokenData(token));
  const results = await Promise.all(tokenDataPromises);

  const tokenData = results
    .map((data, index) => {
      if (data) {
        return {
          symbol: tokens[index],
          price: data.price,
          marketCap: data.marketCap,
        };
      }
      return null;
    })
    .filter(Boolean);

    tokenData.sort((a, b) => {
    const marketCapA = parseFloat(String(a?.marketCap).replace(/[^0-9.-]+/g, "")) || 0;
    const marketCapB = parseFloat(String(b?.marketCap).replace(/[^0-9.-]+/g, "")) || 0;
    return marketCapB - marketCapA;
  });

  return NextResponse.json(tokenData);
}