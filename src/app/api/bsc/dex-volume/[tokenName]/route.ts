import { NextResponse } from 'next/server';

const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens";

interface TokenMapEntry {
  address: string;
}

const TOKEN_MAP: Record<string, TokenMapEntry> = {
  pht: { address: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04" },
  wkc: { address: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb" },
  war: { address: "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d" },
  dtg: { address: "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6" },
  yukan: { address: "0xd086B849a71867731D74D6bB5Df4f640de900171" },
  btcdragon: { address: "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8" },
  ocicat: { address: "0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70" },
  nene: { address: "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3" },
  twc: { address: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596" },
  tkc: { address: "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5" },
  durt: { address: "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1" },
  twd: { address: "0xf00cD9366A13e725AB6764EE6FC8Bd21dA22786e" },
  gtan: { address: "0xbD7909318b9Ca4ff140B840F69bB310a785d1095" },
  zedek: { address: "  " },
  bengcat: { address: "0xD000815DB567372C3C3d7070bEF9fB7a9532F9e8" },
  bcat: { address: "0x47a9B109Cfb8f89D16e8B34036150eE112572435" },
  nct: { address: "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605" },
  kitsune: { address: "0xb6623B503d269f415B9B5c60CDDa3Aa4fE34Fd22" },
  crystalstones: { address: "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00" },
  bft: { address: "0x4b87F578d6FaBf381f43bd2197fBB2A877da6ef8" },
  cross: { address: "0x72928a49c4E88F382b0b6fF3E561F56Dd75485F9" },
  thc: { address: "0x56083560594E314b5cDd1680eC6a493bb851BBd8" },
};

interface DexScreenerResponse {
  pairs: Array<{
    volume?: {
      h24?: string;
    };
  }>;
}

export async function GET(_: Request, context: any): Promise<NextResponse> {
  // Type assertion to safely access params
  const params = context.params as { tokenName?: string };

  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenData = TOKEN_MAP[tokenName || ''];

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const url = `${DEXSCREENER_API_URL}/${tokenData.address}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data from DexScreener: ${response.statusText}`);
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ error: "Token data not found on DexScreener" }, { status: 404 });
    }

    const pair = data.pairs[0];

    return NextResponse.json({
      volume: pair.volume?.h24 || "N/A",
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 500 });
  }
}