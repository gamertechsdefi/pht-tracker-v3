import { NextResponse } from 'next/server';

// Define interfaces
interface TokenData {
  address: string;
}

interface TokenMap {
  [key: string]: TokenData;
}

interface DexScreenerPair {
  priceUsd?: string;
  fdv?: number;
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

interface TokenPriceResponse {
  token: string;
  price: string;
  marketCap: number | string;
  volume: number | string;
  change: number | string;
  liquidity: number | string;
  lastUpdated: string;
}

const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/tokens';

// Token mapping with contract addresses
const TOKEN_MAP: TokenMap = {
  scat: { address: '2NNkCSrbQtrc9tgEJHt4MQUH3ySaxTRAAXt9cUgCkycB' },
  petros: { address: 'Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump' },
  venus: { address: 'Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump' },
  nuke: { address: 'NUKEB18Z7r2o9dT15uu5sjpcvsMKCsUAwJN1xch48JR' },
};

export async function GET(_: Request, context: any): Promise<NextResponse> {
  // Type assertion to safely access params
  const params = context.params as { tokenName?: string };

  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenData = tokenName ? TOKEN_MAP[tokenName] : undefined;

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { address: tokenAddress } = tokenData;
    const url = `${DEXSCREENER_API_URL}/${tokenAddress}`;

    // Fetch token details from DexScreener
    const response = await fetch(url);
    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ error: 'Token data not found on DexScreener' }, { status: 404 });
    }

    const pair = data.pairs[0]; // Get the first pair for simplicity
    console.log(data);

    const result: TokenPriceResponse = {
      token: tokenAddress,
      price: pair.priceUsd || 'N/A',
      marketCap: pair.fdv || 'N/A',
      volume: pair.volume?.h24 || 'N/A',
      change: pair.priceChange?.h24 || 'N/A',
      liquidity: pair.liquidity?.usd || 'N/A',
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch token data', message }, { status: 500 });
  }
}