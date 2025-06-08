// src/app/api/bsc/token-holders-test/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Contract, JsonRpcProvider, isAddress, EventLog } from 'ethers';

// Define response types
interface SuccessResponse {
  tokenAddress: string;
  totalHolders: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// ERC-20 ABI for Transfer events and balanceOf
const TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address) view returns (uint256)',
];

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.code === -32005 && attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// Named export for GET requests
export async function GET(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Validate query parameter
  const { searchParams } = new URL(req.url);
  const tokenAddress = searchParams.get('tokenAddress');

  if (typeof tokenAddress !== 'string' || !isAddress(tokenAddress)) {
    return NextResponse.json(
      {
        error: 'Invalid or missing token address',
        details: 'Token address must be a valid Ethereum address',
      },
      { status: 400 }
    );
  }

  try {
    // Initialize provider
    const provider = new JsonRpcProvider(
      process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
    );

    // Initialize contract
    const contract = new Contract(tokenAddress, TOKEN_ABI, provider);

    // Get current block number
    const latestBlock = await withRetry(() => provider.getBlockNumber());

    // Query Transfer events (paginated by smaller block range)
    const BLOCKS_PER_BATCH = 2000; // Reduced to avoid rate limits
    const startBlock = 0; // Adjust to token's deployment block
    const uniqueAddresses = new Set<string>();

    for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += BLOCKS_PER_BATCH) {
      const toBlock = Math.min(fromBlock + BLOCKS_PER_BATCH - 1, latestBlock);
      const events = await withRetry(() => contract.queryFilter('Transfer', fromBlock, toBlock));

      for (const event of events) {
        if (event instanceof EventLog) {
          const { from, to } = event.args;
          if (from !== '0x0000000000000000000000000000000000000000') {
            uniqueAddresses.add(from);
          }
          if (to !== '0x0000000000000000000000000000000000000000') {
            uniqueAddresses.add(to);
          }
        }
      }
    }

    // Check balances for unique addresses
    const BATCH_SIZE = 50; // Reduced to avoid rate limits
    const holders: string[] = [];

    const addresses = Array.from(uniqueAddresses);
    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
      const batch = addresses.slice(i, i + BATCH_SIZE);
      const balancePromises = batch.map(async (address: string) => {
        try {
          const balance: bigint = await withRetry(() => contract.balanceOf(address)); // Returns BigInt
          return { address, balance };
        } catch {
          return { address, balance: BigInt(0) };
        }
      });

      const results = await Promise.all(balancePromises);
      holders.push(...results.filter(({ balance }) => balance > 0).map(({ address }) => address));
    }

    const totalHolders = holders.length;

    return NextResponse.json({
      tokenAddress,
      totalHolders,
    });
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch token holders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}