import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
	contractAddress: string;
}

/** Simple on-request proxy to the external price-chart API used for RWA tokens.
 * Example external URL:
 * https://liquidity-pool-api.assetchain.org/tokens/<address>/price-chart?selector=D
 */
export async function GET(
	request: NextRequest,
	context: { params: RouteParams }
): Promise<NextResponse> {
	try {
		const { contractAddress } = context.params;

		if (!contractAddress) {
			return NextResponse.json({ error: 'Missing contractAddress parameter' }, { status: 400 });
		}

		// basic validation for an EVM address
		const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(contractAddress);
		if (!isValidAddress) {
			return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
		}

		const url = new URL(request.url);
		const selector = url.searchParams.get('selector') ?? 'D';

		const externalUrl = `https://liquidity-pool-api.assetchain.org/tokens/${contractAddress}/price-chart?selector=${encodeURIComponent(
			selector
		)}`;

		const resp = await fetch(externalUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});

		// Proxy status and body
		const body = await resp.text();

		// If external service returned non-JSON or error, forward message
		const headers: Record<string, string> = {
			'Content-Type': resp.headers.get('content-type') || 'application/json',
			// set caching for edge / CDN
			'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
		};

		return new NextResponse(body, { status: resp.status, headers });

	} catch (error: any) {
		console.error('RWA price-data route error:', error);
		return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
	}
}

