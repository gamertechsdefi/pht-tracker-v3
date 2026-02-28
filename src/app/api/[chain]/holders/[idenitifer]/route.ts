import { NextRequest, NextResponse } from 'next/server';
import { isValidContractAddress } from '@/lib/tokenRegistry';

const CHAIN_ID_MAP: Record<string, string> = {
    'bsc': '56',
    'sol': 'solana',
    'rwa': '56',
    'eth': '1',
};

interface RouteParams {
    chain: string;
    idenitifer: string;
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
    try {
        const { chain, idenitifer: contractAddress } = await context.params;

        if (!chain || !contractAddress) {
            return NextResponse.json({ error: 'Missing chain or contract address' }, { status: 400 });
        }

        const chainLower = chain.toLowerCase();
        const goPlusChainId = CHAIN_ID_MAP[chainLower];

        if (!goPlusChainId) {
            return NextResponse.json({ error: `Chain ${chain} not supported` }, { status: 400 });
        }

        if (!isValidContractAddress(contractAddress, chainLower as 'bsc' | 'sol' | 'rwa' | 'eth')) {
            return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
        }

        // Call GoPlus Token Security API (v1)
        const apiUrl = `https://api.gopluslabs.io/api/v1/token_security/${goPlusChainId}?contract_addresses=${contractAddress}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.code !== 1) {
            console.error('GoPlus API Error Response:', data);
            return NextResponse.json({ error: data.message || 'GoPlus API error', details: data }, { status: 500 });
        }

        const tokenData = data.result?.[contractAddress.toLowerCase()];
        const holder_count = tokenData?.holder_count ?? null;

        return NextResponse.json({ holder_count });

    } catch (error) {
        console.error('GoPlus Honeypot API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch honeypot data' },
            { status: 500 }
        );
    }
}
