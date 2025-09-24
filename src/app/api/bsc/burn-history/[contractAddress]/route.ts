import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, isValidContractAddress } from '@/lib/tokenRegistry';

interface RouteParams {
  contractAddress: string;
}

// Mock burn history data - in a real implementation, this would come from blockchain events
const BURN_HISTORY_MAP: Record<string, Array<{
  date: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}>> = {
  "0x885c99a787be6b41cbf964174c771a9f7ec48e04": [ // PHT
    {
      date: "2024-01-15T10:30:00Z",
      amount: "1000000",
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      blockNumber: 35000000
    },
    {
      date: "2024-01-10T14:20:00Z",
      amount: "500000",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      blockNumber: 34950000
    }
  ],
  // Add more burn history for other tokens as needed
};

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

    // Get burn history for this token
    const burnHistory = BURN_HISTORY_MAP[addressLower] || [];

    const burnData = {
      contractAddress: contractAddress,
      symbol: tokenMetadata.symbol,
      name: tokenMetadata.name,
      burnHistory: burnHistory,
      totalBurnEvents: burnHistory.length,
      totalBurned: burnHistory.reduce((sum, burn) => sum + parseInt(burn.amount), 0).toString(),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(burnData);

  } catch (error) {
    console.error('Burn history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch burn history' },
      { status: 500 }
    );
  }
}
