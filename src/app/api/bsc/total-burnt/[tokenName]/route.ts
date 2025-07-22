import { NextResponse } from 'next/server';
import { getCachedBurnData } from '@/lib/cron-burn-service';


const TOKEN_MAP: Record<string, string> = {
  pht: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
  wkc: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
  war: "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d",
  dtg: "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6",
  yukan: "0xd086B849a71867731D74D6bB5Df4f640de900171",
  btcdragon: "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8",
  ocicat: "0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70",
  nene: "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3",
  twc: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596",
  tkc: "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5",
  durt: "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1",
  twd: "0xf00cD9366A13e725AB6764EE6FC8Bd21dA22786e",
  gtan: "0xbD7909318b9Ca4ff140B840F69bB310a785d1095",
  zedek: "0xCbEaaD74dcB3a4227D0E6e67302402E06c119271",
  bengcat: "0xD000815DB567372C3C3d7070bEF9fB7a9532F9e8",
  bcat: "0x47a9B109Cfb8f89D16e8B34036150eE112572435",
  nct: "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605",
  kitsune: "0xb6623B503d269f415B9B5c60CDDa3Aa4fE34Fd22",
  crystalstones: "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00",
  bft: "0x4b87F578d6FaBf381f43bd2197fBB2A877da6ef8",
  cross: "0x72928a49c4E88F382b0b6fF3E561F56Dd75485F9",
  thc: "0x56083560594E314b5cDd1680eC6a493bb851BBd8",
  bbft: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769",
  bob:  "0x51363f073b1e4920fda7aa9e9d84ba97ede1560e",
  surv: "0xAfF713b62e642b25898e24d5Be6561f863582144",
  tut:  "0xCAAE2A2F939F51d97CdFa9A86e79e3F085b799f3",
};




// Helper function to find block by timestamp (approximate) with rate limiting


function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export async function GET(_: Request, context: any): Promise<NextResponse> {
  const params = context.params as { tokenName?: string };
  const tokenName = params.tokenName?.toLowerCase();
  const tokenAddress = tokenName ? TOKEN_MAP[tokenName] : undefined;

  if (!tokenName || !tokenAddress) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const cachedData = await getCachedBurnData(tokenName);
  const now = new Date();
  let nextUpdate: Date | null = null;
  if (cachedData && cachedData.nextUpdate) {
    nextUpdate = new Date(cachedData.nextUpdate);
  }

  // Always return cached data instantly
  if (cachedData) {
    // If cache is stale, trigger background update (do not await)
    if (nextUpdate && now >= nextUpdate) {
      fetch(`${getBaseUrl()}/api/cron/calculate-burns/${tokenName}`, { method: 'POST' })
        .catch(console.error);
    }
    return NextResponse.json({ ...cachedData, fromCache: true, stale: nextUpdate ? now >= nextUpdate : true });
  }

  // If no cache, trigger background update and return placeholder
  fetch(`${getBaseUrl()}/api/cron/calculate-burns/${tokenName}`, { method: 'POST' })
    .catch(console.error);

  return NextResponse.json({
    address: tokenAddress,
    burn5min: 0,
    burn15min: 0,
    burn30min: 0,
    burn1h: 0,
    burn3h: 0,
    burn6h: 0,
    burn12h: 0,
    burn24h: 0,
    lastUpdated: null,
    fromCache: false,
    stale: true,
    message: "No cached data yet, updating in background."
  });
}