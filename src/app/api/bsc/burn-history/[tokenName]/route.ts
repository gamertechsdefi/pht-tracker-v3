import { NextRequest, NextResponse } from 'next/server';

// Define proper types for API responses and data structures
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

type TokenInfo = {
    address: string;
    burnAddress: string;
};

type FormattedTransaction = {
    from: string;
    to: string;
    amount: number;
    timestamp: string;
    transactionHash: string;
};

// type ApiResponse = {
//     token: string;
//     latestBurnTransactions: FormattedTransaction[];
//     lastUpdated: string;
// };

// type ApiErrorResponse = {
//     error: string;
//     message: string;
// };

// Environment variables should be properly typed
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY as string;
const BSCSCAN_API_URL = "https://api.bscscan.com/api";

// Token mapping with proper typing
const TOKEN_MAP: Record<string, TokenInfo> = {
    pht: { address: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    wkc: { address: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb", burnAddress: "0x0000000000000000000000000000000000000000" },
    war: { address: "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d", burnAddress: "0x0000000000000000000000000000000000000000" },
    dtg: { address: "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6", burnAddress: "0x0000000000000000000000000000000000000000" },
    yukan: { address: "0xd086B849a71867731D74D6bB5Df4f640de900171", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    btcdragon: { address: "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8", burnAddress: "0x0000000000000000000000000000000000000000" },
    ocicat: { address: "0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70", burnAddress: "0x0000000000000000000000000000000000000000" },
    nene: { address: "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3", burnAddress: "0x0000000000000000000000000000000000000000" },
    twc: { address: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bnb: { address: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    tkc: { address: "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    durt: { address: "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    twd: { address: "0xf00cD9366A13e725AB6764EE6FC8Bd21dA22786e", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    gtan: { address: "0xbD7909318b9Ca4ff140B840F69bB310a785d1095", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    zedek: { address: "0xCbEaaD74dcB3a4227D0E6e67302402E06c119271", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bengcat: { address: "0xD000815DB567372C3C3d7070bEF9fB7a9532F9e8", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bcat: { address: "0x47a9B109Cfb8f89D16e8B34036150eE112572435", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    ncat: { address: "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    kitsune: { address: "0xb6623B503d269f415B9B5c60CDDa3Aa4fE34Fd22", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    crystalstones: { address: "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bft: { address: "0x4b87F578d6FaBf381f43bd2197fBB2A877da6ef8", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    cross: { address: "0x72928a49c4E88F382b0b6fF3E561F56Dd75485F9", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    thc: { address: "0x56083560594E314b5cDd1680eC6a493bb851BBd8", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bbft: { address: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    surv: { address: "0xc0b1d2f3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8h9", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    bob: { address: "0x51363F073b1E4920fdA7AA9E9d84BA97EdE1560e", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    tut:{ address: "0x1234567890abcdef1234567890abcdef12345678", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    puffcat: {address: "0x14a8d0AC8Fc456899F2DD33C3f4E32403A78126c", burnAddress: "0x000000000000000000000000000000000000dEaD"},
    mbc: { address: "0x170f044f9c7a41ff83caccad6ccca1b941d75af7", burnAddress: "0x000000000000000000000000000000000000dEaD"},
    crepe: { address: "0xeb2B7d5691878627eff20492cA7c9a71228d931D", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    popielno: { address: "0xdc3d92dd5a468edb7a7772452700cc93bb1826ad", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    spray: { address: "0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    mars: { address: "0x6844b2e9afb002d188a072a3ef0fbb068650f214", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    sdc: { address: "0x8cDC41236C567511f84C12Da10805cF50Dcdc27b", burnAddress: "0x000000000000000000000000000000000000dEaD"},
    kind: { address: "0x41f52A42091A6B2146561bF05b722Ad1d0e46f8b", burnAddress: "0x000000000000000000000000000000000000dEaD"},
    shibc: { address: "0x456B1049bA12f906326891486B2BA93e46Ae0369", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    pcat: { address: "0xFeD56F9Cd29F44e7C61c396DAc95cb3ed33d3546", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    egw: { address: "0x2056d14A4116A7165cfeb7D79dB760a06b57DBCa", burnAddress: "0x000000000000000000000000000000000000dEaD" },
    
};

/**
 * Format a timestamp to a human-readable "time ago" string
 * @param timestamp - The date to format
 * @returns A formatted string representing time elapsed
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
 * Handler for GET requests to fetch token burn transactions
 * @param req - NextRequest object
 * @param context - Context containing route parameters
 * @returns NextResponse with transaction data or error
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const { pathname } = req.nextUrl;
        const tokenName = pathname.split('/').pop()?.toLowerCase();

        if (!tokenName) {
            return NextResponse.json(
                { error: "Token name is required", message: "No token name provided" },
                { status: 400 }
            );
        }

        const tokenData = TOKEN_MAP[tokenName];
        if (!tokenData) {
            return NextResponse.json(
                { error: "Invalid token", message: `Token '${tokenName}' not found` },
                { status: 400 }
            );
        }

        // The rest of your existing code...

        const { address: tokenAddress, burnAddress } = tokenData;

        // Validate API key
        if (!BSCSCAN_API_KEY) {
            console.error("Missing BSCSCAN_API_KEY environment variable");
            return NextResponse.json(
                { error: "Server configuration error", message: "API key not configured" },
                { status: 500 }
            );
        }

        const url = `${BSCSCAN_API_URL}?module=account&action=tokentx&contractaddress=${tokenAddress}&address=${burnAddress}&sort=desc&offset=50&page=1&apikey=${BSCSCAN_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json() as BscscanApiResponse;

        if (data.status !== "1") {
            return NextResponse.json(
                { error: "Failed to fetch burn transactions", message: data.message },
                { status: 500 }
            );
        }

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

        return NextResponse.json({
            token: tokenAddress,
            latestBurnTransactions: transactions,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        // Properly type the error
        const typedError = error as Error;
        console.error("API Error:", typedError);

        return NextResponse.json(
            { error: "Failed to fetch burn transactions", message: typedError.message },
            { status: 500 }
        );
    }
}