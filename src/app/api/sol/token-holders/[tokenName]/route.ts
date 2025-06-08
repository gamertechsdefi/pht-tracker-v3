import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosResponse } from 'axios';

const API_KEY = process.env.COVALENT_API_KEY ?? '';
const CHAIN_ID = '56';

interface CovalentResponse {
  data: { items: any[]; pagination: { total_count: number } };
  error?: boolean;
  error_message?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenName?: string } }
): Promise<NextResponse> {
  try {
    console.log('API Key:', API_KEY ? 'Set' : 'Missing');
    const tokenName = params.tokenName?.toLowerCase();
    if (!tokenName || tokenName !== 'pht') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const tokenAddress = '0x885c99a787BE6b41cbf964174C771A9f7ec48e04';
    const url = `https://api.covalenthq.com/v1/${CHAIN_ID}/tokens/${tokenAddress}/token_holders/?page-size=10`;

    const response: AxiosResponse<CovalentResponse> = await axios.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      },
    });

    const totalHolders = response.data.data.pagination.total_count;
    return NextResponse.json({
      token: tokenAddress,
      totalHolders,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      { error: 'Failed to fetch token holders', message: error.message },
      { status: 500 }
    );
  }
}