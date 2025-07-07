import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

// Configure for BNB Chain instead of Ethereum
const RPC_URL: string = "https://bsc-dataseed.binance.org/";
const DEFAULT_TOKEN_ADDRESS: string = process.env.TOKEN_ADDRESS || "0x885c99a787be6b41cbf964174c771a9f7ec48e04"; // Default token
const DEAD_ADDRESS: string = "0x000000000000000000000000000000000000dEaD";
const LOCKED_ADDRESSES: string[] = process.env.LOCKED_ADDRESSES ? process.env.LOCKED_ADDRESSES.split(',') : [];

// Token map
const TOKEN_MAP: Record<string, string> = {
  pht: DEFAULT_TOKEN_ADDRESS,
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
};

// ERC-20 ABI for required functions
const ERC20_ABI: ethers.InterfaceAbi = [
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

// Cache structure
interface CacheEntry {
  data: TokenMetrics;
  timestamp: number;
}

interface TokenMetrics {
  address: string;
  totalSupply: string;
  totalBurnt: string;
  lockedSupply: string;
  circulatingSupply: string;
  lastUpdated: string;
}

const tokenCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL: number = 60 * 1000; // 1 minute cache

export async function GET(_: Request, context: any): Promise<NextResponse> {
  // Type assertion to safely access params
  const params = context.params as { tokenName?: string };

  try {
    const tokenName = params.tokenName?.toLowerCase() || 'myToken';
    const tokenAddress = TOKEN_MAP[tokenName] || DEFAULT_TOKEN_ADDRESS;

    const now = Date.now();
    const cachedData = tokenCache.get(tokenAddress);
    if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData.data);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Fetch supply, burn, and locked data
    const [totalSupply, decimals, burnAddressBalance, lockedSupply] = await Promise.all([
      contract.totalSupply() as Promise<bigint>,
      contract.decimals() as Promise<number>,
      contract.balanceOf(DEAD_ADDRESS) as Promise<bigint>,
      getLockedSupply(contract, LOCKED_ADDRESSES),
    ]);

    const divisor = BigInt(10) ** BigInt(decimals);
    const totalBurnt = burnAddressBalance;
    const circulatingSupply = totalSupply - totalBurnt - lockedSupply;

    const result: TokenMetrics = {
      address: tokenAddress,
      totalSupply: formatTokenAmount(totalSupply, divisor),
      totalBurnt: formatTokenAmount(totalBurnt, divisor),
      lockedSupply: formatTokenAmount(lockedSupply, divisor),
      circulatingSupply: formatTokenAmount(circulatingSupply, divisor),
      lastUpdated: new Date().toISOString(),
    };

    tokenCache.set(tokenAddress, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch token metrics", message: (error as Error).message },
      { status: 500 }
    );
  }
}

async function getLockedSupply(contract: ethers.Contract, lockedAddresses: string[]): Promise<bigint> {
  if (!lockedAddresses.length) return BigInt(0);
  try {
    const balances = await Promise.all(
      lockedAddresses.map((address) => contract.balanceOf(address) as Promise<bigint>)
    );
    return balances.reduce((total, balance) => total + balance, BigInt(0));
  } catch (error: unknown) {
    console.error("Error fetching locked supply:", error);
    return BigInt(0);
  }
}

function formatTokenAmount(amount: bigint, divisor: bigint): string {
  return (Number(amount) / Number(divisor)).toString();
}