import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for our data structures
interface TokenData {
  address: string;
}

interface TokenMap {
  [key: string]: TokenData;
}

interface PriceChange {
  h24?: string;
}

interface Volume {
  h24?: string;
}

interface Liquidity {
  usd?: string;
}

interface TokenPair {
  priceUsd?: string;
  fdv?: string;
  volume?: Volume;
  priceChange?: PriceChange;
  liquidity?: Liquidity;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface DexScreenerResponse {
  pairs?: TokenPair[];
}

interface CoinGeckoResponse {
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
}

interface TokenProfileResponse {
  token: string;
  price: string;
  marketCap: string;
  volume: string;
  change: string;
  liquidity: string;
  lastUpdated: string;
  profileImage?: string;
  headerImage?: string;
  relatedProfiles?: { type: string; url: string }[];
}

interface ErrorResponse {
  error: string;
  message?: string;
}

const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/coins";

// Token mapping with contract addresses
const TOKEN_MAP: TokenMap = {
  "pht": { address: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04" },
  "wkc": { address: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb" },
  "war": { address: "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d" },
  "dtg": { address: "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6" },
  "yukan": { address: "0xd086B849a71867731D74D6bB5Df4f640de900171" },
  "btcdragon": { address: "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8" },
  "ocicat": { address: "0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70" },
  "nene": { address: "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3" },
  "twc": { address: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596" },
  "tkc": { address: "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5" },
  "durt": { address: "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1" },
  "twd": { address: "0xf00cD9366A13e725AB6764EE6Fc8Bd21dA22786e" },
  "gtan": { address: "0xbD7909318b9Ca4ff140B840F69bB310a785d1095" },
  "zedek": { address: "0xCbEaaD74dcB3a4227D0E6e67302402E06c119271" },
  "bengcat": { address: "0xD000815DB567372C3C3d7070bEF9fB7a9532F9e8" },
  "bcat": { address: "0x47a9B109Cfb8f89D16e8B34036150eE112572435" },
  "nct": { address: "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605" },
  "kitsune": { address: "0xb6623B503d269f415B9B5c60CDDa3Aa4fE34Fd22" },
  "crystalstones": { address: "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00" },
  "bft": { address: "0x4b87F578d6FaBf381f43bd2197fBB2A877da6ef8" },
  "cross": { address: "0x72928a49c4E88F382b0b6fF3E561F56Dd75485F9" },
  "thc": { address: "0x56083560594E314b5cDd1680eC6a493bb851BBd8" },
  "bbft": {address: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769" },
  "bob": { address: '0x51363f073b1e4920fda7aa9e9d84ba97ede1560e' },
  "surv": {address: '0xAfF713b62e642b25898e24d5Be6561f863582144' },
  "tut": { address: '0xCAAE2A2F939F51d97CdFa9A86e79e3F085b799f3' },
  "puffcat": { address: "0x14a8d0AC8Fc456899F2DD33C3f4E32403A78126c"},
  "crepe": { address: "0xeb2B7d5691878627eff20492cA7c9a71228d931D" },
  "popielno": { address: "0xdc3d92dd5a468edb7a7772452700cc93bb1826ad" }, 
  "spray": { address: "0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575" },
  "mbc": { address: "0x170f044f9c7a41ff83caccad6ccca1b941d75af7" },
  "mars": { address: "0x6844b2e9afb002d188a072a3ef0fbb068650f214" },
  "sdc": { address: "0x8cDC41236C567511f84C12Da10805cF50Dcdc27b" },
  "kind": { address: "0x41f52A42091A6B2146561bF05b722Ad1d0e46f8b" },
  "shibc": { address: "0x456B1049bA12f906326891486B2BA93e46Ae0369" },
  "pcat": { address: "0xFeD56F9Cd29F44e7C61c396DAc95cb3ed33d3546" },
  "egw": { address: "0x2056d14A4116A7165cfeb7D79dB760a06b57DBCa" },
  "1000pdf": { address: "0xCa7930478492CDe4Be997FA898Cd1a6AfB8F41A1" },
  "aidove": { address: "0xe9E3CDB871D315fEE80aF4c9FcD4886782694856" },
  "hmt": { address: "0x360f2cf415d9be6e82a7252681ac116fb63d2fa2" },
  "rbcat": { address: "0x14A2db256Ef18c4f7165d5E48f65a528b4155100" },
  "peso": { address: "0xC54CA14328d5b61E4BDc8A4d4b08b6B8D06BC372" },
};

async function fetchCoinGeckoImage(tokenAddress: string): Promise<string | undefined> {
  try {
    // Note: CoinGecko requires a token ID, not just an address. For simplicity, we try a search.
    const searchUrl = `${COINGECKO_API_URL}/list`;
    const response = await fetch(searchUrl);
    const coins = await response.json() as { id: string; symbol: string; name: string }[];
    
    // Find a coin by matching address (simplified, may need more robust mapping)
    const tokenName = Object.keys(TOKEN_MAP).find(
      (key) => TOKEN_MAP[key].address.toLowerCase() === tokenAddress.toLowerCase()
    );
    
    if (!tokenName) return undefined;

    const coin = coins.find((c) => c.symbol.toLowerCase() === tokenName.toLowerCase());
    if (!coin) return undefined;

    // const coinDetailsUrl = `${COINGECKO_API_URL}/${coin.id}`;
    // const detailsResponse = await fetch(coinDetailsUrl);
    const details = await response.json() as CoinGeckoResponse;

    return details.image?.large || details.image?.small || details.image?.thumb;
  } catch (error) {
    console.error("CoinGecko API Error:", error);
    return undefined;
  }
}

export async function GET(
  request: NextRequest,
  context: any
): Promise<NextResponse<TokenProfileResponse | ErrorResponse>> {
  // Type assertion to safely access params
  const params = context.params as { tokenName: string };

  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenData = TOKEN_MAP[tokenName];

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const { address: tokenAddress } = tokenData;
    const url = `${DEXSCREENER_API_URL}/${tokenAddress}`;
    
    // Fetch token details from DexScreener
    const response = await fetch(url);
    const data = await response.json() as DexScreenerResponse;

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json(
        { error: "Token data not found on DexScreener" },
        { status: 404 }
      );
    }

    const pair = data.pairs[0]; // Get the first pair for simplicity

    // Fetch profile image from CoinGecko as a fallback (DexScreener may not provide images)
    const profileImage = pair.info?.imageUrl || await fetchCoinGeckoImage(tokenAddress);

    // Extract related profiles from socials or websites
    const relatedProfiles = [
      ...(pair.info?.socials || []),
      ...(pair.info?.websites?.map((w) => ({ type: "website", url: w.url })) || []),
    ];

    return NextResponse.json({
      token: tokenAddress,
      price: pair.priceUsd || "N/A",
      marketCap: pair.fdv || "N/A",
      volume: pair.volume?.h24 || "N/A",
      change: pair.priceChange?.h24 || "N/A",
      liquidity: pair.liquidity?.usd || "N/A",
      lastUpdated: new Date().toISOString(),
      profileImage: profileImage || "N/A",
      headerImage: "N/A", // DexScreener doesn't provide header images; could scrape token page if needed
      relatedProfiles: relatedProfiles.length > 0 ? relatedProfiles : [],
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch token data", 
        message: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}