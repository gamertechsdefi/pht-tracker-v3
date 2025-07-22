import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getCachedBurnData, calculateBurnData, saveBurnDataToFirebase } from '@/lib/cron-burn-service';

const RPC_URL = "https://bsc-mainnet.infura.io/v3/de990c1b30544bb680e45aba81204a4c";
const provider = new ethers.JsonRpcProvider(RPC_URL);

const BURN_ADDRESSES = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000"
] as const;

const TOKEN_MAP: Record<string, string> = {
  pht: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
  wkc: "0x933477eba23726ca95a957cb85dbb1957267ef85",
  war: "0xf1c2d7d7e539a02acc3f0c46ca1e83c0f69baac2",
  dtg: "0xd2e4a524d1a932adbc70fb41f2bec05884d5f6c2",
  yukan: "0x0797395fcad3f27059405f266080701a77688c7f",
  btcdragon: "0x59670d4ac4862b5b9c495ca31a2a4bc6fd1d0101",
  ocicat: "0x1df65d3a75aecd000a9c17c97e99993af01dbcd1",
  nene: "0x9697815e4581cdf320cbc4aac212dc92a1ac2992",
  twc: "0x955ed3d0e1d2615a1d7bebb10ffab37f150bbb21",
  durt: "0xdc98307571709e048f8c6d1ff0bb48eab054e535",
  gtan: "0xe965e86bc7da68fd489c4ab438eb81a48a4ad6e5",
  zedek: "0x246d1711a3834c405845ae52de0b808ef9bfba6e",
  tkc: "0xbee567474f87f7725791f2872d165fb69e0bbcdd",
  twd: "0x4f61c7672d36da605cef5e52f6f2896193b61e83",
  bcat: "0x91e5de867f67cf90d3f658b22aff4e8c881d4d2a",
  nct: "0xa52c143c9f5e410497e671ec9ad40b868835e9bb",
  kitsune: "0x969d92e917e68a3a4e8596770852d94bd315d194",
  bengcat: "0x07acf7676d34adf7c217c89a1efbf8379c00cea6",
  crystalstones: "0xe252fcb1aa2e0876e9b5f3ed1e15b9b4d11a0b00",
  bft: "0x99c2d5977b94bdfdf91ee36f613e330e8102e326",
  cross: "0x3e93fec6e3ae5940dac4869acf5178bd30f4fc04",
  thc: "0x62be1533f3a78de99ca297ebbe489a3fb7253bef",
  bbft: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769",
  bob: "0x51363F073b1E4920fdA7AA9E9d84BA97EdE1560e",

};

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

type IntervalKey =
  | 'burn5min'
  | 'burn15min'
  | 'burn30min'
  | 'burn1h'
  | 'burn3h'
  | 'burn6h'
  | 'burn12h'
  | 'burn24h';

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
}

// Rate limiting and retry configuration for fallback
const RATE_LIMIT_DELAY = 100; // 100ms between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isRateLimitError = error?.message?.includes('rate limit') || 
                              error?.message?.includes('too many requests') ||
                              error?.code === 429;

      if (isLastAttempt || !isRateLimitError) {
        throw error;
      }

      const backoffDelay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(`Rate limited, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await delay(backoffDelay);
    }
  }
  throw new Error('Max retries exceeded');
}

// Get the block closest to a given timestamp with rate limiting
async function getBlockFromTimestamp(timestamp: number): Promise<number> {
  return retryWithBackoff(async () => {
    const latest = await provider.getBlock("latest");
    if (!latest) throw new Error("Cannot get latest block");
    const current = latest.number;
    let lower = current - 5000;
    let upper = current;

    while (lower <= upper) {
      const mid = Math.floor((lower + upper) / 2);
      const block = await provider.getBlock(mid);
      await delay(RATE_LIMIT_DELAY); // Rate limiting
      
      if (!block) break;

      if (block.timestamp < timestamp) {
        lower = mid + 1;
      } else if (block.timestamp > timestamp) {
        upper = mid - 1;
      } else {
        return mid;
      }
    }
    return lower;
  });
}

const iface = new ethers.Interface(ERC20_ABI);

async function fetchBurnLogs(token: string, from: number, to: number): Promise<bigint> {
  return retryWithBackoff(async () => {
    const transferTopic = ethers.id("Transfer(address,address,uint256)");
    const burnTopics = BURN_ADDRESSES.map(addr => ethers.zeroPadValue(addr.toLowerCase(), 32));

    let total = BigInt(0);

    for (let i = from; i <= to; i += 2000) {
      const toBlock = Math.min(i + 1999, to);

      for (const burnAddress of burnTopics) {
        try {
          const logs = await provider.getLogs({
            address: token,
            fromBlock: i,
            toBlock,
            topics: [transferTopic, null, burnAddress],
          });
          await delay(RATE_LIMIT_DELAY); // Rate limiting

          for (const log of logs) {
            try {
              // Optional: quick guard to reduce parse errors
              if (log.topics.length !== 3) continue;

              const parsed = iface.parseLog(log);
              if (parsed?.args?.[2]) {
                total += parsed.args[2];
              }
            } catch {
              continue;
            }
          }
        } catch (error) {
          console.error(`Error fetching logs for burn address ${burnAddress}:`, error);
        }
      }
    }

    return total;
  });
}

// Main API Route
export async function GET(req: NextRequest, context: any): Promise<NextResponse> {
  const { tokenName } = context.params;
  const lowerToken = tokenName?.toLowerCase();

  if (!lowerToken || !TOKEN_MAP[lowerToken]) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const tokenAddress = TOKEN_MAP[lowerToken];

  try {
    // Try to get cached data first
    const cachedData = await getCachedBurnData(lowerToken);
    
    if (cachedData) {
      const now = new Date();
      const nextUpdate = new Date(cachedData.nextUpdate);
      
      // If cache is still valid, return it
      if (now < nextUpdate) {
        return NextResponse.json({
          ...cachedData,
          fromCache: true
        });
      }
    }

    // If we reach here, we need fresh data
    console.log(`Cache miss for ${lowerToken}, calculating fresh data...`);
    
    // Try to calculate fresh data using the cron service
    const freshData = await calculateBurnData(lowerToken);
    
    if (freshData) {
      // Save to cache for next time
      try {
        await saveBurnDataToFirebase(lowerToken, freshData);
      } catch (error) {
        console.error('Failed to save to cache:', error);
      }
      
      return NextResponse.json({
        ...freshData,
        fromCache: false
      });
    }

    // If cron service fails, fall back to real-time calculation
    console.log(`Falling back to real-time calculation for ${lowerToken}...`);

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [latestBlock, decimals] = await Promise.all([
      retryWithBackoff(() => provider.getBlockNumber()),
      retryWithBackoff(() => contract.decimals())
    ]);

    const latestBlockData = await retryWithBackoff(() => provider.getBlock(latestBlock));
    if (!latestBlockData) throw new Error("Could not fetch latest block data");
    const latestTimestamp = latestBlockData.timestamp;

    // Get fromBlock for 24h
    const fromBlock24h = await getBlockFromTimestamp(latestTimestamp - 24 * 60 * 60);
    const totalBlocks = latestBlock - fromBlock24h;
    const blocksPerSecond = totalBlocks / (24 * 60 * 60); // 86400 seconds

    const intervalsInSeconds: Record<IntervalKey, number> = {
      burn5min: 5 * 60,
      burn15min: 15 * 60,
      burn30min: 30 * 60,
      burn1h: 60 * 60,
      burn3h: 3 * 60 * 60,
      burn6h: 6 * 60 * 60,
      burn12h: 12 * 60 * 60,
      burn24h: 24 * 60 * 60,
    };

    const blockMap: Record<IntervalKey, number> = {} as any;
    for (const [key, seconds] of Object.entries(intervalsInSeconds)) {
      const blocksAgo = Math.floor(blocksPerSecond * seconds);
      blockMap[key as IntervalKey] = Math.max(latestBlock - blocksAgo, fromBlock24h);
    }

    const divisor = BigInt(10) ** BigInt(decimals);

    // Fetch burn amounts sequentially to avoid overwhelming the API
    const burnResults = [];
    const intervalEntries = Object.entries(blockMap);
    
    for (let i = 0; i < intervalEntries.length; i++) {
      const [key, fromBlock] = intervalEntries[i];
      const amount = await fetchBurnLogs(tokenAddress, fromBlock, latestBlock);
      burnResults.push([key, Number(amount) / Number(divisor)]);
      
      // Add delay between requests to avoid rate limiting
      if (i < intervalEntries.length - 1) {
        await delay(RATE_LIMIT_DELAY * 2);
      }
    }

    const resultMap = Object.fromEntries(burnResults);
    const response: BurnData = {
      address: tokenAddress,
      burn5min: resultMap.burn5min || 0,
      burn15min: resultMap.burn15min || 0,
      burn30min: resultMap.burn30min || 0,
      burn1h: resultMap.burn1h || 0,
      burn3h: resultMap.burn3h || 0,
      burn6h: resultMap.burn6h || 0,
      burn12h: resultMap.burn12h || 0,
      burn24h: resultMap.burn24h || 0,
      lastUpdated: new Date().toISOString(),
      fromCache: false,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Main fetch failed:", err);
    return NextResponse.json({ error: "Unable to fetch burn data." }, { status: 500 });
  }
}
