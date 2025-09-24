import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, isValidContractAddress } from '@/lib/tokenRegistry';

// Configure for BNB Chain
const RPC_URL: string = "https://bsc-dataseed.binance.org/";
const DEAD_ADDRESS: string = "0x000000000000000000000000000000000000dEaD";

interface RouteParams {
  contractAddress: string;
}

// ERC-20 ABI for basic token functions
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

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

    // Connect to BSC network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

    // Get burned tokens (tokens sent to dead address)
    const [deadBalance, decimals] = await Promise.all([
      tokenContract.balanceOf(DEAD_ADDRESS),
      tokenContract.decimals()
    ]);

    // Format the burned amount
    const divisor = BigInt(10) ** BigInt(decimals);
    const burnedAmount = BigInt(deadBalance.toString()) / divisor;

    const burnData = {
      totalBurnt: burnedAmount.toString(),
      deadAddress: DEAD_ADDRESS,
      contractAddress: contractAddress,
      symbol: tokenMetadata.symbol,
      name: tokenMetadata.name,
      decimals: decimals.toString(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(burnData);

  } catch (error) {
    console.error('Total burnt API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch burn data' },
      { status: 500 }
    );
  }
}
