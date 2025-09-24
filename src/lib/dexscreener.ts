
import { TOKEN_MAP, getTokenBySymbol, getTokenByAddress } from './tokenRegistry';

const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";

// Re-export for backward compatibility
export { TOKEN_MAP, getTokenBySymbol, getTokenByAddress };

// Enhanced function that works with both token symbols and contract addresses
export async function getTokenData(tokenIdentifier: string) {
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

        const url = `${DEXSCREENER_API_URL}/${tokenAddress}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error fetching data for ${tokenIdentifier}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            return null;
        }

        const pair = data.pairs[0];

        return {
          token: tokenAddress,
          price: pair.priceUsd || "N/A",
          marketCap: pair.marketCap || "N/A",
          volume: pair.volume?.h24 || "N/A",
          change24h: pair.priceChange?.h24 || "N/A",
          change6h: pair.priceChange?.h6 || "N/A",
          change3h: pair.priceChange?.h3 || "N/A",
          change1h: pair.priceChange?.h1 || "N/A",
          liquidity: pair.liquidity?.usd || "N/A",
          lastUpdated: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`Failed to fetch token data for ${tokenIdentifier}:`, error);
        return null;
    }
}

// Legacy function for backward compatibility
export async function getTokenDataBySymbol(tokenName: string) {
    return getTokenData(tokenName);
}

// New function specifically for contract addresses
export async function getTokenDataByAddress(contractAddress: string) {
    return getTokenData(contractAddress);
}
