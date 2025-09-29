import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/db/firebase';

interface BurnData {
  tokenName: string;
  tokenAddress: string;
  burn5min: number;
  burn15min: number;
  burn30min: number;
  burn1h: number;
  burn3h: number;
  burn6h: number;
  burn12h: number;
  burn24h: number;
  lastUpdated: string;
  lastProcessedBlock: number;
  computationTime: number;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function GET(
  request: NextRequest,
  context: { params: { contractAddress?: string } }
): Promise<NextResponse> {
  try {
    const contractAddress = context.params.contractAddress?.toLowerCase();

    if (!contractAddress || !isValidAddress(contractAddress)) {
      return NextResponse.json(
        { error: "Valid contract address is required" },
        { status: 400 }
      );
    }

    // Use contract address as Firestore doc key
    const docRef = doc(db, 'burnData', contractAddress);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          error: "No burn data available",
          message: `No burn data found for contract address ${contractAddress}`
        },
        { status: 404 }
      );
    }

    const burnData = docSnap.data() as BurnData;

    return NextResponse.json({
      ...burnData,
      fromCache: true,
      stale: false,
      message: "Using cached data from Firestore"
    });

  } catch (error) {
    console.error(`Error in GET /api/bsc/total-burnt/[contractAddress]:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch burn data",
        details: error instanceof Error ? error.message : 'Unknown error',
        message: "An error occurred while fetching burn data"
      },
      { status: 500 }
    );
  }
}