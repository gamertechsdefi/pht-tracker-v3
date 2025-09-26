import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, isValidContractAddress } from '@/lib/tokenRegistry';

interface RouteParams {
  contractAddress: string;
}

// Define proper types for BSCScan API responses
type BscscanApiResponse = {
    status: string;
    message: string;
    result: BscscanTransaction[];
};

type BscscanTransaction = {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    contractAddress: string;
    to: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    input: string;
    confirmations: string;
};

type FormattedTransaction = {
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    transactionHash: string;
};

// Environment variables
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY as string;
const BSCSCAN_API_URL = "https://api.bscscan.com/api";
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

/**
 * Format a timestamp to a human-readable "time ago" string
 */
function formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    interface TimeInterval {
        label: string;
        seconds: number;
    }

    const intervals: TimeInterval[] = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }

    return "just now";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { contractAddress } = params;

    if (!contractAddress) {
      return NextResponse.json({ error: 'Missing contract address' }, { status: 400 });
    }

    const addressLower = contractAddress.toLowerCase();

    // Validate contract address format
    if (!isValidContractAddress(addressLower, 'bsc')) {
      return NextResponse.json({ error: 'Invalid contract address format' }, { status: 400 });
    }

    // Verify token exists in registry
    const tokenMetadata = getTokenByAddress(addressLower);
    if (!tokenMetadata) {
      return NextResponse.json({ error: 'Token not found in registry' }, { status: 404 });
    }

    // Verify it's a BSC token
    if (tokenMetadata.chain !== 'bsc') {
      return NextResponse.json({
        error: `Token is on ${tokenMetadata.chain.toUpperCase()}, not BSC`
      }, { status: 400 });
    }

    // Validate API key
    if (!BSCSCAN_API_KEY) {
      console.error("Missing BSCSCAN_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error", message: "API key not configured" },
        { status: 500 }
      );
    }

    // Fetch burn transactions from BSCScan API
    const url = `${BSCSCAN_API_URL}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${DEAD_ADDRESS}&sort=desc&offset=50&page=1&apikey=${BSCSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json() as BscscanApiResponse;

    if (data.status !== "1") {
      return NextResponse.json(
        { error: "Failed to fetch burn transactions", message: data.message },
        { status: 500 }
      );
    }

    // Format the transactions
    const transactions: FormattedTransaction[] = data.result.map((tx: BscscanTransaction) => {
      // Ensure values are properly converted
      const tokenDecimal = Number(tx.tokenDecimal);
      const txValue = tx.value;
      const timeStamp = Number(tx.timeStamp);

      // Handle potential NaN issues with safe conversions
      const amount = !isNaN(tokenDecimal) && txValue ?
        Number(txValue) / Math.pow(10, tokenDecimal) : 0;

      const txTimestamp = !isNaN(timeStamp) ?
        new Date(timeStamp * 1000) : new Date();

      return {
        from: tx.from,
        to: tx.to,
        amount: amount,
        timestamp: formatTimeAgo(txTimestamp),
        transactionHash: tx.hash,
      };
    });

    const burnData = {
      contractAddress: contractAddress,
      symbol: tokenMetadata.symbol,
      name: tokenMetadata.name,
      burnHistory: transactions,
      totalBurnEvents: transactions.length,
      totalBurned: transactions.reduce((sum: number, burn: FormattedTransaction) => sum + burn.amount, 0).toString(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(burnData);

  } catch (error) {
    // Properly type the error
    const typedError = error as Error;
    console.error("Burn history API error:", typedError);

    return NextResponse.json(
      { error: "Failed to fetch burn history", message: typedError.message },
      { status: 500 }
    );
  }
}
