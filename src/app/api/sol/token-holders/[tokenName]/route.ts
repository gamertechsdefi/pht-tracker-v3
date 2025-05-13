import { NextResponse } from 'next/server';

// Define interfaces for the token map and API response
interface TokenData {
  address: string;
}

interface TokenMap {
  [key: string]: TokenData;
}

interface MoralisResponse {
  totalHolders?: number;
  message?: string;
}

const MORALIS_API_URL = "https://solana-gateway.moralis.io/token/mainnet/holders";
const MORALIS_API_KEY = process.env.MORALIS_API_KEY as string;

const TOKEN_MAP: TokenMap = {
  scat: { address: "2NNkCSrbQtrc9tgEJHt4MQUH3ySaxTRAAXt9cUgCkycB" },
  petros: { address: "Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump" },
  venus: { address: "Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump" },
  nuke: { address: "NUKEB18Z7r2o9dT15uu5sjpcvsMKCsUAwJN1xch48JR" },
};

export async function GET(_: Request, context: any): Promise<NextResponse> {
  // Type assertion to safely access params
  const params = context.params as { tokenName?: string };

  try {
    const tokenName = params.tokenName?.toLowerCase();
    const tokenData = tokenName ? TOKEN_MAP[tokenName] : undefined;

    if (!tokenName || !tokenData) {
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

    const data: MoralisResponse = await response.json();
    console.log("Response Data:", data);

    if (!data || data.totalHolders === undefined) {
      console.error("Error fetching holders:", data);
      return NextResponse.json(
        { error: "Failed to fetch holders", message: data?.message || "Unknown error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: tokenAddress,
      totalHolders: data.totalHolders,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch token holders", message }, { status: 500 });
  }
}