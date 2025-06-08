// app/api/token-holders/[tokenName]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MORALIS_API_URL = "https://solana-gateway.moralis.io/token/mainnet/holders";
const MORALIS_API_KEY = process.env.MORALIS_API_KEY as string;

interface TokenMapEntry {
  address: string;
}

const TOKEN_MAP: Record<string, TokenMapEntry> = {
  scat: { address: "2NNkCSrbQtrc9tgEJHt4MQUH3ySaxTRAAXt9cUgCkycB" },
  petros: { address: "Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump" },
  venus: { address: "Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump" },
  nuke: { address: "NUKEB18Z7r2o9dT15uu5sjpcvsMKCsUAwJN1xch48JR" },
};

interface Params {
  params: {
    tokenName: string;
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenData = TOKEN_MAP[tokenName];

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const { address: tokenAddress } = tokenData;
    const url = `${MORALIS_API_URL}/${tokenAddress}`;

    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key": MORALIS_API_KEY,
      },
    });

    const data = await response.json();

    if (!data || data.totalHolders === undefined) {
      console.error("Error fetching holders:", data);
      return NextResponse.json({
        error: "Failed to fetch holders",
        message: data?.message || "Unknown error"
      }, { status: 500 });
    }

    return NextResponse.json({
      token: tokenAddress,
      totalHolders: data.totalHolders,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({
      error: "Failed to fetch token holders",
      message: error.message,
    }, { status: 500 });
  }
}
