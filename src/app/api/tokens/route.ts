import { NextResponse } from 'next/server';
import { getTokenData } from '../../../lib/dexscreener';
import { TOKEN_REGISTRY } from '../../../lib/tokenRegistry';

export async function GET() {
  // Get all BSC tokens from the registry (including duplicates)
  const bscTokens = TOKEN_REGISTRY.filter(token => token.chain === 'bsc');

  const tokenDataPromises = bscTokens.map(token => getTokenData(token.address));
  const results = await Promise.all(tokenDataPromises);

  const tokenData = results
    .map((data, index) => {
      if (data) {
        const token = bscTokens[index];
        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
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