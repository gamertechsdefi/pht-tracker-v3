import { NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';

// Solana RPC connection (using mainnet)
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Define interfaces
interface TokenMap {
  [key: string]: string;
}

interface TokenMetrics {
  address: string;
  totalSupply: number;
  totalBurnt: number;
  circulatingSupply: number;
  lastUpdated: string;
}

// Token addresses map
const TOKEN_MAP: TokenMap = {
  scat: '2NNkCSrbQtrc9tgEJHt4MQUH3ySaxTRAAXt9cUgCkycB',
  petros: 'Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump',
  venus: 'Ck1fkTAPVjXUbBVhtv7E6FC451i8Hu8oXovaGuRUpump',
  nuke: 'NUKEB18Z7r2o9dT15uu5sjpcvsMKCsUAwJN1xch48JR',
};

// Solana "Burn Address" (equivalent to `0x000...dEaD` on Ethereum)
const DEAD_ADDRESS = new PublicKey('11111111111111111111111111111111');

export async function GET(_: Request, context: any): Promise<NextResponse> {
  // Type assertion to safely access params
  const params = context.params as { tokenName?: string };

  try {
    const tokenName = params.tokenName?.toLowerCase();
    const mintAddress = tokenName ? TOKEN_MAP[tokenName] : undefined;

    if (!mintAddress) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const mintPublicKey = new PublicKey(mintAddress);

    // Fetch token mint details
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    if (
      !mintInfo.value ||
      !(mintInfo.value.data as ParsedAccountData).parsed ||
      (mintInfo.value.data as ParsedAccountData).parsed.type !== 'mint'
    ) {
      throw new Error('Invalid mint address');
    }

    const decimals = (mintInfo.value.data as ParsedAccountData).parsed.info.decimals;
    const totalSupply = BigInt((mintInfo.value.data as ParsedAccountData).parsed.info.supply);

    // Fetch burned supply (tokens sent to DEAD_ADDRESS)
    const burnAccount = await connection
      .getTokenAccountBalance(DEAD_ADDRESS)
      .catch(() => ({ value: { amount: '0' } }));
    const burnBalance = BigInt(burnAccount.value.amount || '0');
    const circulatingSupply = totalSupply - burnBalance;

    const result: TokenMetrics = {
      address: mintAddress,
      totalSupply: formatTokenAmount(totalSupply, decimals),
      totalBurnt: formatTokenAmount(burnBalance, decimals),
      circulatingSupply: formatTokenAmount(circulatingSupply, decimals),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch token metrics', message }, { status: 500 });
  }
}

// Helper function to format token amounts based on decimals
function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}