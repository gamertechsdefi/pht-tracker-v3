import { ethers } from 'ethers';
import { NextResponse } from 'next/server';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/db/firebase'; // Assuming db is exported as Firestore instance

// Configuration constants
const RPC_URL = "https://bsc-mainnet.infura.io/v3/de990c1b30544bb680e45aba81204a4c";
const BURN_ADDRESSES = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000"
] as const;

// Token map with lowercase keys and Ethereum addresses
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
  twd: "0xf00cD9366A13e725AB6764EE6FC8Bd21", // Note: Incomplete address
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
};

// ERC20 ABI
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

// Cache configuration
const CACHE_DURATION = {
  SHORT: 30, // 30 seconds for 5min, 15min, 30min intervals
  MEDIUM: 120, // 2 minutes for 1h interval
  LONG: 300, // 5 minutes for 3h, 6h, 12h, 24h intervals
} as const;

// Interface for burn data response
interface BurnData {
  address: string;
  burn5min: number;
  burn15min: number;
  burn30min: number;
  burn1h: number;
  burn3h: number;
  burn6h: number;
  burn12h: number;
  burn24h: number;
  lastUpdated: string;
  fromCache?: boolean;
  cacheTime?: string;
}

// Interface for cached data
interface CachedData {
  data: BurnData | null;
  fresh: boolean;
}

// Helper function to get cached data from Firebase
async function getCachedBurnData(tokenName: string): Promise<CachedData> {
  try {
    const burnDataCollection = collection(db, 'burnData');
    const docRef = doc(burnDataCollection, tokenName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as BurnData;
      const now = Date.now();
      const lastUpdated = new Date(data.lastUpdated).getTime();

      // Check if cache is still valid
      if (now - lastUpdated < CACHE_DURATION.SHORT * 1000) {
        return { data, fresh: true };
      }
      return { data, fresh: false };
    }
    return { data: null, fresh: false };
  } catch (error) {
    console.error("Error getting cached data:", error);
    return { data: null, fresh: false };
  }
}

// Helper function to update cache
async function updateCache(tokenName: string, data: BurnData): Promise<void> {
  try {
    const burnDataCollection = collection(db, 'burnData');
    const docRef = doc(burnDataCollection, tokenName);
    await setDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
    console.log(`Cache updated for ${tokenName}`);
  } catch (error) {
    console.error("Error updating cache:", error);
  }
}

// Next.js API route handler
export async function GET(_: Request, { params }: { params: { tokenName?: string } }) {
  try {
    const tokenName = params.tokenName?.toLowerCase();
    if (!tokenName) {
      return NextResponse.json({ error: "Token name is required" }, { status: 400 });
    }

    const tokenAddress = TOKEN_MAP[tokenName];
    if (!tokenAddress) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Try to get data from cache first
    const { data: cachedData, fresh } = await getCachedBurnData(tokenName);
    
    // If we have fresh cached data, return it immediately
    if (cachedData && fresh) {
      return NextResponse.json(cachedData);
    }

    // If we reach here, we need to fetch fresh data
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Get latest block and decimals in parallel
    const [latestBlock, decimals] = await Promise.all([
      provider.getBlockNumber(),
      contract.decimals(),
    ]);

    const latestBlockData = await provider.getBlock(latestBlock);
    if (!latestBlockData) {
      return NextResponse.json({ error: "Failed to fetch latest block data" }, { status: 500 });
    }
    const latestTimestamp = latestBlockData.timestamp;

    // Calculate start of today UTC
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const startOfDayTimestamp = Math.floor(now.getTime() / 1000);
    const blocksSinceMidnight = Math.floor((latestTimestamp - startOfDayTimestamp) / 3);
    const startBlock = Math.max(latestBlock - blocksSinceMidnight, 1);

    // Calculate time intervals
    const intervals: Record<string, number> = {
      fiveMin: 5 * 60, // 5 minutes
      fifteenMin: 15 * 60,
      thirtyMin: 30 * 60,
      oneHour: 60 * 60, // 1 hour
      threeHours: 3 * 60 * 60, // 3 hours
      sixHours: 6 * 60 * 60, // 6 hours
      twelveHours: 12 * 60 * 60, // 12 hours
    };

    // Calculate block estimates for each interval
    const blockEstimates: Record<string, number> = {};
    for (const [key, seconds] of Object.entries(intervals)) {
      const timestampAgo = latestTimestamp - seconds;
      const blockEstimate = Math.floor((latestTimestamp - timestampAgo) / 3);
      blockEstimates[key] = Math.max(latestBlock - blockEstimate, 1);
    }

    // Helper: fetch logs in a block range
    const fetchBurnLogs = async (fromBlock: number, toBlock: number): Promise<bigint> => {
      // Create a topic for burn addresses
      const burnAddressesTopics = BURN_ADDRESSES.map(addr => 
        ethers.zeroPadValue(addr.toLowerCase(), 32)
      );
      
      // Fetch logs using appropriate filter
      const logs = await provider.getLogs({
        fromBlock,
        toBlock,
        address: tokenAddress,
        topics: [
          ethers.id("Transfer(address,address,uint256)"),
          null,
          burnAddressesTopics
        ]
      });

      let total = BigInt(0);
      logs.forEach(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.args) {
            total += BigInt(parsed.args[2]);
          }
        } catch (e) {
          console.error("Log parsing error:", e);
        }
      });
      return total;
    };

    // Fetch burn amounts for all intervals in parallel
    const [
      totalBurned5min,
      totalBurned15min, 
      totalBurned30min,
      totalBurned1h,
      totalBurned3h,
      totalBurned6h,
      totalBurned12h,
      totalBurned24h
    ] = await Promise.all([
      fetchBurnLogs(blockEstimates.fiveMin, latestBlock),
      fetchBurnLogs(blockEstimates.fifteenMin, latestBlock),
      fetchBurnLogs(blockEstimates.thirtyMin, latestBlock),
      fetchBurnLogs(blockEstimates.oneHour, latestBlock),
      fetchBurnLogs(blockEstimates.threeHours, latestBlock),
      fetchBurnLogs(blockEstimates.sixHours, latestBlock),
      fetchBurnLogs(blockEstimates.twelveHours, latestBlock),
      fetchBurnLogs(startBlock, latestBlock)
    ]);

    // Convert to decimal values
    const divisor = BigInt(10) ** BigInt(decimals);
    const burn5min = Number(totalBurned5min) / Number(divisor);
    const burn15min = Number(totalBurned15min) / Number(divisor);
    const burn30min = Number(totalBurned30min) / Number(divisor);
    const burn1h = Number(totalBurned1h) / Number(divisor);
    const burn3h = Number(totalBurned3h) / Number(divisor);
    const burn6h = Number(totalBurned6h) / Number(divisor);
    const burn12h = Number(totalBurned12h) / Number(divisor);
    const burn24h = Number(totalBurned24h) / Number(divisor);

    // Prepare the response data
    const responseData: BurnData = {
      address: tokenAddress,
      burn5min,
      burn15min,
      burn30min,
      burn1h,
      burn3h,
      burn6h,
      burn12h,
      burn24h,
      lastUpdated: new Date().toISOString(),
    };

    // Update the cache asynchronously (don't await)
    updateCache(tokenName, responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("API Error:", error);
    
    // If we have stale cached data, return it as a fallback
    try {
      const { data: cachedData } = await getCachedBurnData(params.tokenName?.toLowerCase() || '');
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          fromCache: true,
          cacheTime: cachedData.lastUpdated,
        });
      }
    } catch (e) {
      console.error("Error getting fallback cache:", e);
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch burn data", 
      message: error.message 
    }, { status: 500 });
  }
}