import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getTokenByAddress, isValidContractAddress } from '@/lib/tokenRegistry';

// Define proper types for API responses and data structures
interface RouteParams {
    contractAddress: string;
}

type FormattedTransaction = {
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    transactionHash: string;
};

interface BurnHistoryResponse {
    token: string;
    contractAddress: string;
    burnAddresses: string[];
    latestBurnTransactions: FormattedTransaction[];
    lastUpdated: string;
}

interface ErrorResponse {
    error: string;
    message?: string;
}

// Environment variables
const RPC_ENDPOINT = process.env.RPC_ENDPOINT as string;

// ERC20 ABI - minimal interface for token transfers
const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

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

/**
 * Fetch burn transactions using ethers.js for multiple burn addresses
 */
async function fetchBurnTransactions(
    provider: ethers.JsonRpcProvider,
    tokenAddress: string,
    burnAddresses: string[],
    limit: number = 50
): Promise<FormattedTransaction[]> {
    try {
        // Create contract instance
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        // Get token decimals
        const decimals = await contract.decimals();

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        
        // Query Transfer events to burn addresses (last ~10000 blocks to optimize)
        const fromBlock = Math.max(0, currentBlock - 10000);
        
        // Fetch events for all burn addresses
        const allEvents: ethers.EventLog[] = [];
        
        for (const burnAddress of burnAddresses) {
            const filter = contract.filters.Transfer(null, burnAddress);
            const events = await contract.queryFilter(filter, fromBlock, currentBlock);
            
            // Filter and add EventLog instances
            const eventLogs = events.filter((event): event is ethers.EventLog => 
                event instanceof ethers.EventLog
            );
            allEvents.push(...eventLogs);
        }

        // Sort by block number descending and limit results
        const sortedEvents = allEvents
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .slice(0, limit);

        // Format transactions
        const transactions: FormattedTransaction[] = await Promise.all(
            sortedEvents.map(async (event) => {
                const block = await event.getBlock();
                const timestamp = new Date(block.timestamp * 1000);
                
                // Parse the Transfer event args
                const from = event.args[0] as string;
                const to = event.args[1] as string;
                const value = event.args[2] as bigint;

                const amount = Number(ethers.formatUnits(value, decimals));

                return {
                    from,
                    to,
                    amount,
                    timestamp: formatTimeAgo(timestamp),
                    transactionHash: event.transactionHash,
                };
            })
        );

        return transactions;
    } catch (error) {
        console.error("Error fetching burn transactions:", error);
        throw error;
    }
}

/**
 * Handler for GET requests to fetch token burn transactions
 */
export async function GET(
    _request: NextRequest,
    context: { params: Promise<RouteParams> }
): Promise<NextResponse<BurnHistoryResponse | ErrorResponse>> {
    try {
        const params = await context.params;
        const { contractAddress } = params;

        if (!contractAddress) {
            return NextResponse.json(
                { error: "Missing contract address" },
                { status: 400 }
            );
        }

        const addressLower = contractAddress.toLowerCase();

        // Validate contract address format
        if (!isValidContractAddress(addressLower, 'bsc')) {
            return NextResponse.json(
                { error: "Invalid contract address format" },
                { status: 400 }
            );
        }

        // Verify token exists in registry
        const tokenMetadata = getTokenByAddress(addressLower);
        if (!tokenMetadata) {
            return NextResponse.json(
                { error: "Token not found in registry" },
                { status: 404 }
            );
        }

        // Verify it's a BSC token
        if (tokenMetadata.chain !== 'bsc') {
            return NextResponse.json(
                { error: `Token is on ${tokenMetadata.chain.toUpperCase()}, not BSC` },
                { status: 400 }
            );
        }

        const tokenAddress = tokenMetadata.address;
        
        // Get burn addresses - support both common burn addresses
        const burnAddresses = [
            "0x000000000000000000000000000000000000dEaD", // Most common burn address
            "0x0000000000000000000000000000000000000000"  // Zero address (also used for burns)
        ];

        // Validate RPC endpoint
        if (!RPC_ENDPOINT) {
            console.error("Missing RPC_ENDPOINT environment variable");
            return NextResponse.json(
                { error: "Server configuration error", message: "RPC endpoint not configured" },
                { status: 500 }
            );
        }

        console.log("Connecting to RPC:", RPC_ENDPOINT.replace(/api_key=[^&]+/, 'api_key=***'));

        // Create provider - URL should include ?api_key= parameter
        const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT, 56, {
            staticNetwork: ethers.Network.from(56),
        });

        // Test the connection
        try {
            const blockNumber = await provider.getBlockNumber();
            console.log("Connected successfully. Current block:", blockNumber);
        } catch (error) {
            console.error("Provider connection error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json(
                { error: "Failed to connect to RPC endpoint", message: errorMessage },
                { status: 500 }
            );
        }

        // Fetch burn transactions from all burn addresses
        const transactions = await fetchBurnTransactions(
            provider,
            tokenAddress,
            burnAddresses,
            50
        );

        return NextResponse.json({
            token: tokenMetadata.symbol.toUpperCase(),
            contractAddress: contractAddress,
            burnAddresses: burnAddresses,
            latestBurnTransactions: transactions,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        const typedError = error as Error;
        console.error("API Error:", typedError);

        return NextResponse.json(
            { error: "Failed to fetch burn transactions", message: typedError.message },
            { status: 500 }
        );
    }
}