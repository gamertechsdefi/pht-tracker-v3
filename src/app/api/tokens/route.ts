import { TOKEN_MAP, TOKEN_REGISTRY } from '@/lib/tokenRegistry';
import { NextRequest, NextResponse } from 'next/server';

const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";
const ASSETCHAIN_LIQUIDITY_API = "https://liquidity-pool-api.assetchain.org/tokens";

interface DexScreenerPair {
  priceUsd?: string;
  marketCap?: number;
  volume?: {
    h24?: string;
  };
  priceChange?: {
    h24?: string;
    h6?: string;
    h3?: string;
    h1?: string;
  };
  liquidity?: {
    usd?: string;
  };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

interface AssetChainTokenItem {
  symbol: string;
  address: string;
  usdPrice: string;
  marketCap: string;
  pastDayVolume: string;
  currentTvl: string;
  name: string;
  decimals: number;
  isVerified: boolean;
  iconUrl: string;
}

interface AssetChainResponse {
  items: AssetChainTokenItem[];
}

interface TokenData {
  token: string;
  price: string;
  marketCap: string;
  volume: string;
  change24h: string;
  liquidity: string;
  totalSupply?: string;
  decimals?: number;
  name?: string;
  isVerified?: boolean;
  iconUrl?: string;
  lastUpdated: string;
  sources: {
    assetchain: boolean;
    dexscreener: boolean;
  };
}

// Fetch from AssetChain Liquidity Pool API
async function fetchFromAssetChain(tokenAddress: string): Promise<Partial<TokenData> | null> {
  try {
    const url = `${ASSETCHAIN_LIQUIDITY_API}?address=${tokenAddress}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`AssetChain API error for ${tokenAddress}: ${response.statusText}`);
      return null;
    }

    const data: AssetChainResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const tokenData = data.items[0];

    return {
      token: tokenData.address,
      price: tokenData.usdPrice || "N/A",
      marketCap: tokenData.marketCap || "N/A",
      volume: tokenData.pastDayVolume || "N/A",
      liquidity: tokenData.currentTvl || "N/A",
      decimals: tokenData.decimals,
      name: tokenData.name,
      isVerified: tokenData.isVerified,
      iconUrl: tokenData.iconUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch from AssetChain for ${tokenAddress}:`, error);
    return null;
  }
}

// Fetch from DexScreener API
async function fetchFromDexScreener(tokenAddress: string): Promise<Partial<TokenData> | null> {
  try {
    const url = `${DEXSCREENER_API_URL}/${tokenAddress}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`DexScreener API error for ${tokenAddress}: ${response.statusText}`);
      return null;
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    const pair = data.pairs[0];

    return {
      token: tokenAddress,
      price: pair.priceUsd || "N/A",
      marketCap: pair.marketCap?.toString() || "N/A",
      volume: pair.volume?.h24 || "N/A",
      change24h: pair.priceChange?.h24 || "N/A",
      liquidity: pair.liquidity?.usd || "N/A",
    };
  } catch (error) {
    console.error(`Failed to fetch from DexScreener for ${tokenAddress}:`, error);
    return null;
  }
}

// Merge data from both sources, preferring non-"N/A" values
function mergeTokenData(
  assetChainData: Partial<TokenData> | null,
  dexScreenerData: Partial<TokenData> | null,
  tokenAddress: string
): TokenData {
  const merged: TokenData = {
    token: tokenAddress,
    price: "N/A",
    marketCap: "N/A",
    volume: "N/A",
    change24h: "N/A",

    liquidity: "N/A",
    lastUpdated: new Date().toISOString(),
    sources: {
      assetchain: !!assetChainData,
      dexscreener: !!dexScreenerData,
    },
  };

  // Helper function to pick the best value (prefer non-"N/A" values)
  const pickBestValue = (val1: string | undefined, val2: string | undefined): string => {
    if (val1 && val1 !== "N/A") return val1;
    if (val2 && val2 !== "N/A") return val2;
    return "N/A";
  };

  // Merge data, preferring AssetChain for price and market cap (more accurate for AssetChain tokens)
  if (assetChainData) {
    merged.price = pickBestValue(assetChainData.price, dexScreenerData?.price);
    merged.marketCap = pickBestValue(assetChainData.marketCap, dexScreenerData?.marketCap);
    merged.volume = pickBestValue(assetChainData.volume, dexScreenerData?.volume);
    merged.liquidity = pickBestValue(assetChainData.liquidity, dexScreenerData?.liquidity);
    

    if (assetChainData.totalSupply) merged.totalSupply = assetChainData.totalSupply;
    if (assetChainData.decimals) merged.decimals = assetChainData.decimals;
    if (assetChainData.name) merged.name = assetChainData.name;
    if (assetChainData.isVerified !== undefined) merged.isVerified = assetChainData.isVerified;
    if (assetChainData.iconUrl) merged.iconUrl = assetChainData.iconUrl;
  }

  // DexScreener provides price change data that AssetChain doesn't have
  if (dexScreenerData) {
    merged.change24h = pickBestValue(dexScreenerData.change24h, merged.change24h);

    // If AssetChain data is missing, use DexScreener as fallback
    if (merged.price === "N/A") merged.price = dexScreenerData.price || "N/A";
    if (merged.marketCap === "N/A") merged.marketCap = dexScreenerData.marketCap || "N/A";
    if (merged.volume === "N/A") merged.volume = dexScreenerData.volume || "N/A";
    if (merged.liquidity === "N/A") merged.liquidity = dexScreenerData.liquidity || "N/A";
  }

  return merged;
}

// Enhanced function that fetches from BOTH APIs simultaneously
async function getTokenData(tokenIdentifier: string): Promise<TokenData | null> {
  try {
    let tokenAddress: string;

    // Check if the identifier is a contract address or a symbol
    if (tokenIdentifier.startsWith('0x') && tokenIdentifier.length === 42) {
      // It's a contract address
      tokenAddress = tokenIdentifier;
    } else {
      // It's a symbol, look up the address
      const tokenData = TOKEN_MAP[tokenIdentifier.toLowerCase()];
      if (!tokenData) {
        return null;
      }
      tokenAddress = tokenData.address;
    }

    // Fetch from BOTH APIs in parallel
    const [assetChainData, dexScreenerData] = await Promise.allSettled([
      fetchFromAssetChain(tokenAddress),
      fetchFromDexScreener(tokenAddress)
    ]);

    // Extract results from Promise.allSettled
    const assetChainResult = assetChainData.status === 'fulfilled' ? assetChainData.value : null;
    const dexScreenerResult = dexScreenerData.status === 'fulfilled' ? dexScreenerData.value : null;

    // If both failed, return null
    if (!assetChainResult && !dexScreenerResult) {
      console.error(`No data found for ${tokenIdentifier} from either source`);
      return null;
    }

    // Merge data from both sources
    return mergeTokenData(assetChainResult, dexScreenerResult, tokenAddress);

  } catch (error) {
    console.error(`Failed to fetch token data for ${tokenIdentifier}:`, error);
    return null;
  }
}

// New function to fetch from specific source only
async function getTokenDataFromSource(
  tokenIdentifier: string, 
  source: 'dexscreener' | 'assetchain'
): Promise<Partial<TokenData> | null> {
  try {
    let tokenAddress: string;

    // Check if the identifier is a contract address or a symbol
    if (tokenIdentifier.startsWith('0x') && tokenIdentifier.length === 42) {
      tokenAddress = tokenIdentifier;
    } else {
      const tokenData = TOKEN_MAP[tokenIdentifier.toLowerCase()];
      if (!tokenData) {
        return null;
      }
      tokenAddress = tokenData.address;
    }

    if (source === 'assetchain') {
      return await fetchFromAssetChain(tokenAddress);
    } else {
      return await fetchFromDexScreener(tokenAddress);
    }
  } catch (error) {
    console.error(`Failed to fetch token data from ${source} for ${tokenIdentifier}:`, error);
    return null;
  }
}

// API Route Handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');
    const source = searchParams.get('source') as 'dexscreener' | 'assetchain' | null;
    const sortBy = searchParams.get('sortBy') || 'marketCap'; // Default sort by market cap

    // If identifier is provided, fetch single token
    if (identifier) {
      let data;
      if (source) {
        // Fetch from specific source
        data = await getTokenDataFromSource(identifier, source);
      } else {
        // Fetch from both sources and merge
        data = await getTokenData(identifier);
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data, { status: 200 });
    }

    // If no identifier, fetch all tokens from TOKEN_REGISTRY
    const allTokens = TOKEN_REGISTRY.map(token => ({
      symbol: token.symbol,
      address: token.address,
      name: token.name,
      chain: token.chain,
    }));

    // Fetch data for all tokens in parallel
    const tokenDataPromises = allTokens.map(async (token) => {
      try {
        const data = await getTokenData(token.address);
        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          chain: token.chain,
          price: data?.price || 'N/A',
          marketCap: data?.marketCap || 'N/A',
          volume: data?.volume || 'N/A',
          change24h: data?.change24h || 'N/A',
          liquidity: data?.liquidity || 'N/A',
        };
      } catch (error) {
        console.error(`Error fetching data for ${token.symbol}:`, error);
        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          chain: token.chain,
          price: 'N/A',
          marketCap: 'N/A',
          volume: 'N/A',
          change24h: 'N/A',
          liquidity: 'N/A',
        };
      }
    });

    const tokensData = await Promise.all(tokenDataPromises);

    // Sort tokens by market cap (descending)
    const sortedTokens = tokensData.sort((a, b) => {
      if (sortBy === 'marketCap') {
        const mcA = parseFloat(String(a.marketCap).replace(/[^0-9.-]+/g, '')) || 0;
        const mcB = parseFloat(String(b.marketCap).replace(/[^0-9.-]+/g, '')) || 0;
        return mcB - mcA; // Descending order
      } else if (sortBy === 'volume') {
        const volA = parseFloat(String(a.volume).replace(/[^0-9.-]+/g, '')) || 0;
        const volB = parseFloat(String(b.volume).replace(/[^0-9.-]+/g, '')) || 0;
        return volB - volA;
      }
      return 0;
    });

    return NextResponse.json(sortedTokens, { status: 200 });
  } catch (error) {
    console.error('Error in tokens API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}