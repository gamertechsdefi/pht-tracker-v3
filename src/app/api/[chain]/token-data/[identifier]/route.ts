import { NextRequest, NextResponse } from 'next/server';
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from '@/lib/tokenRegistry';

interface RouteParams {
  chain: string;
  identifier: string;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { chain, identifier } = params;
    
    if (!chain || !identifier) {
      return NextResponse.json({ error: 'Missing chain or identifier' }, { status: 400 });
    }

    const chainLower = chain.toLowerCase() as 'bsc' | 'sol';
    
    // Determine if identifier is a contract address or symbol
    let tokenMetadata;
    
    if (isValidContractAddress(identifier, chainLower)) {
      // It's a contract address
      tokenMetadata = getTokenByAddress(identifier);
    } else {
      // It's a symbol
      tokenMetadata = getTokenBySymbol(identifier);
    }

    if (!tokenMetadata) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Verify chain matches
    if (tokenMetadata.chain !== chainLower) {
      return NextResponse.json({ 
        error: `Token is on ${tokenMetadata.chain.toUpperCase()}, not ${chainLower.toUpperCase()}` 
      }, { status: 400 });
    }

    return NextResponse.json({
      address: tokenMetadata.address,
      symbol: tokenMetadata.symbol,
      name: tokenMetadata.name,
      chain: tokenMetadata.chain,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}
