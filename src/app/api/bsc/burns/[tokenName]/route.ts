import { ethers } from 'ethers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Infura BSC Mainnet RPC URL
const RPC_URL = "https://bsc-mainnet.infura.io/v3/de990c1b30544bb680e45aba81204a4c";
const BURN_ADDRESSES: string[] = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000"
];

// Token mapping
const TOKEN_MAP: Record<string, string> = {
  "pht": "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
  "wkc": "0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
  "war": "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d",
  "dtg": "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6",
  "yukan": "0xd086B849a71867731D74D6bB5Df4f640de900171",
  "btcdragon": "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8",
  "ocicat": "0x37Fe635D1e25B2F7276C1B9dBBcc7b087f80C050",
  "nene": "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3",
  "twc": "0xDA1060158F7D593667cCE0A15DB346BB3FfB3596",
  "tkc": "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5",
  "durt": "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1",
  "twd": "0xf00cD9366A13e725AB6764EE6FC8Bd21dA22786e",
  "gtan": "0xbD7909318b9Ca4ff140B840F69bB310a785d1095",
  "zedek": "0xCbEaaD74dcB3a4227D0E6e67302402E06c119271",
  "bengcat": "0xa2b1d88570949a761D640b7C1b08a17CBb8F823c",
  "bcat": "0x47a9B109Cfb8f89D16e8B34036150eE112572435",
  "nct": "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605",
};

// ERC-20 ABI for transfer event
const ERC20_ABI: string[] = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)"
];

interface TokenBurnResponse {
  address: string;
  burn24h: number;
  lastUpdated: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { tokenName: string } }
): Promise<NextResponse<TokenBurnResponse | ErrorResponse>> {
  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenAddress = TOKEN_MAP[tokenName];
    
    if (!tokenAddress) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Get the start of the day in UTC (00:00)
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const startTimestamp = Math.floor(now.getTime() / 1000);

    // Get current block number and timestamp
    const latestBlock = await provider.getBlockNumber();
    const latestBlockData = await provider.getBlock(latestBlock);
    
    if (!latestBlockData) {
      throw new Error("Failed to fetch latest block data");
    }
    
    const latestTimestamp = latestBlockData.timestamp;

    // Estimate block number for start of the day (~3 sec per block on BSC)
    const blocksPerDay = Math.floor((latestTimestamp - startTimestamp) / 3);
    const startBlock = Math.max(latestBlock - blocksPerDay, 1);

    // Create a filter for burn addresses (type-safe)
    const burnAddressesTopics = BURN_ADDRESSES.map(addr => ethers.zeroPadValue(addr, 32));

    // Fetch transfer events to burn addresses
    const logs = await provider.getLogs({
      fromBlock: startBlock,
      toBlock: 'latest',
      address: tokenAddress,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null,
        burnAddressesTopics
      ]
    });

    // Sum burn amounts
    let totalBurned = BigInt(0);
    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        if (parsed && parsed.args) {
          totalBurned += BigInt(parsed.args[2]);
        }
      } catch (error) {
        console.error("Error parsing log:", error);
      }
    }

    // Format output
    const decimals = await contract.decimals();
    const burn24h = Number(totalBurned) / Number(BigInt(10) ** BigInt(decimals));

    return NextResponse.json({
      address: tokenAddress,
      burn24h,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch 24-hour burn", message: errorMessage }, 
      { status: 500 }
    );
  }
}