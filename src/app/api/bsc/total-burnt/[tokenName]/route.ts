import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/db/firebase';

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
  puffcat: "0x14a8d0AC8Fc456899F2DD33C3f4E32403A78126c",
  crepe: "0xeb2B7d5691878627eff20492cA7c9a71228d931D",
  popielno: "0xdc3d92dd5a468edb7a7772452700cc93bb1826ad",
  spray: "0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575",
  mbc: "0x170f044f9c7a41ff83caccad6ccca1b941d75af7",
  mars: "0x6844b2e9afb002d188a072a3ef0fbb068650f214",
  sdc: "0x8cDC41236C567511f84C12Da10805cF50Dcdc27b",
  kind: "0x41f52A42091A6B2146561bF05b722Ad1d0e46f8b",
  shibc: "0x456B1049bA12f906326891486B2BA93e46Ae0369",
  pcat: "0xFeD56F9Cd29F44e7C61c396DAc95cb3ed33d3546",
  egw: "0x2056d14A4116A7165cfeb7D79dB760a06b57DBCa",
  "1000pdf": "0xCa7930478492CDe4Be997FA898Cd1a6AfB8F41A1",
};

interface BurnData {
  tokenName: string;
  tokenAddress: string;
  burn5min: number;
  burn15min: number;
  burn30min: number;
  burn1h: number;
  burn3h: number;
  burn6h: number;
  burn12h: number;
  burn24h: number;
  lastUpdated: string;
  lastProcessedBlock: number;
  computationTime: number;
}

export async function GET(
  request: NextRequest,

): Promise<NextResponse> {
  try {
    const { pathname } = request.nextUrl;
    const tokenName = pathname.split('/').pop()?.toLowerCase();

    if (!tokenName) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }

    const tokenAddress = TOKEN_MAP[tokenName];
    if (!tokenAddress) {
      return NextResponse.json(
        { error: `Token '${tokenName}' is not supported` },
        { status: 404 }
      );
    }

    // Fetch data from Firestore
    const docRef = doc(db, 'burnData', tokenName);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          error: "No burn data available",
          message: `No burn data found for token ${tokenName}`
        },
        { status: 404 }
      );
    }

    const burnData = docSnap.data() as BurnData;

    // Return the burn data with cache info
    return NextResponse.json({
      ...burnData,
      fromCache: true,
      stale: false,
      message: "Using cached data from Firestore"
    });

  } catch (error) {
    console.error(`Error in GET /api/bsc/total-burnt/[tokenName]:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch burn data",
        details: error instanceof Error ? error.message : 'Unknown error',
        message: "An error occurred while fetching burn data"
      },
      { status: 500 }
    );
  }
}