import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, isValidContractAddress } from '@/lib/tokenRegistry';

interface RouteParams {
  contractAddress: string;
}

interface PriceChange {
  h24?: string;
  h6?: string;
  h3?: string;
  h1?: string;
}

interface Volume {
  h24?: string;
}

interface Liquidity {
  usd?: string;
}

interface TokenPair {
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  volume?: Volume;
  priceChange?: PriceChange;
  liquidity?: Liquidity;
}

interface DexScreenerResponse {
  pairs?: TokenPair[];
}

interface TokenPriceResponse {
  token: string;
  contractAddress: string;
  price: string;
  marketCap: string;
  fdv: string;
  volume: string;
  change24h: string;
  change6h: string;
  change3h: string;
  change1h: string;
  liquidity: string;
}

interface ErrorResponse {
  error: string;
}

const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse<TokenPriceResponse | ErrorResponse>> {
  try {
    const params = await context.params;
    const { contractAddress } = params;
    
    if (!contractAddress) {
      return NextResponse.json({ error: 'Missing contract address' }, { status: 400 });
    }

    const addressLower = contractAddress.toLowerCase();
    
    // Validate contract address format
    if (!isValidContractAddress(addressLower, 'bsc')) {
      return NextResponse.json({ error: 'Invalid contract address format' }, { status: 400 });
    }

    // Verify token exists in registry
    const tokenMetadata = getTokenByAddress(addressLower);
    if (!tokenMetadata) {
      return NextResponse.json({ error: 'Token not found in registry' }, { status: 404 });
    }

    // Verify it's a BSC token
    if (tokenMetadata.chain !== 'bsc') {
      return NextResponse.json({ 
        error: `Token is on ${tokenMetadata.chain.toUpperCase()}, not BSC` 
      }, { status: 400 });
    }

    const tokenAddress = tokenMetadata.address;

    // Fetch data from DexScreener API using contract address
    const response = await fetch(`${DEXSCREENER_API_URL}/${tokenAddress}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch token data from DexScreener" },
        { status: response.status }
      );
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json(
        { error: "No trading pairs found for this token" },
        { status: 404 }
      );
    }

    // Get the first pair (usually the most liquid one)
    const pair = data.pairs[0];

    const tokenPriceData: TokenPriceResponse = {
      token: tokenMetadata.symbol.toUpperCase(),
      contractAddress: contractAddress,
      price: pair.priceUsd || "0",
      marketCap: pair.marketCap?.toString() || "0",
      fdv: pair.fdv?.toString() || "0",
      volume: pair.volume?.h24 || "0",
      change24h: pair.priceChange?.h24 || "0",
      change6h: pair.priceChange?.h6 || "0",
      change3h: pair.priceChange?.h3 || "0",
      change1h: pair.priceChange?.h1 || "0",
      liquidity: pair.liquidity?.usd || "0",
    };

    return NextResponse.json(tokenPriceData);

  } catch (error) {
    console.error("Token price API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
