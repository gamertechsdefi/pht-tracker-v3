import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";

interface RouteParams {
  chain: string;
  identifier: string;
}

// Fallback social links mapping for tokens that don't have socials in the registry yet
const FALLBACK_SOCIALS: Record<string, { website: string; twitter: string; telegram: string; bscscan: string }> = {
  wkc: {
    website: "https://wikicatcoin.com",
    twitter: "https://x.com/WikiCatCoin",
    telegram: "https://t.me/wkc_token",
    bscscan: "https://bscscan.com/token/0x57Bfe2aF99AeB7a3de3bc0c42c22353742bfD20D"
  },
  war: {
    website: "https://waterrabbittoken.com",
    twitter: "https://twitter.com/WaterRabbitNew",
    telegram: "https://t.me/war_token",
    bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
  },
  dtg: {
    website: "https://defitigertoken.com",
    twitter: "https://x.com/DefiTigerToken",
    telegram: "https://t.me/DefiTigertoken",
    bscscan: "https://bscscan.com/token/0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6"
  },
  yukan: {
    website: "https://yukantoken.org",
    twitter: "https://x.com/YukanTokenNew",
    telegram: "https://t.me/YUKANTOKEN_TG",
    bscscan: "https://bscscan.com/token/0xd086B849a71867731D74D6bB5Df4f640de900171"
  },
  btcdragon: {
    website: "https://btcdragon.lol",
    twitter: "https://x.com/BTCDragonToken",
    telegram: "https://t.me/BTCDragonOfficial",
    bscscan: "https://bscscan.com/token/0x1Ee8a2f28586e542af677eB15Fd00430f98d8fd8"
  },
  ocicat: {
    website: "https://ocicat.club",
    twitter: "https:/x.com/OcicatCoin",
    telegram: "https://t.me/ocicatcoin",
    bscscan: "https://bscscan.com/token/0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70"
  },
  nene: {
    website: "https://nene.la",
    twitter: "https://x.com/nenebsc",
    telegram: "https://t.me/NENEBSC/1",
    bscscan: "https://bscscan.com/token/0x551877c1a3378c3a4b697be7f5f7111e88ab4af3"
  },
  twc: {
    website: "https://tiwiecosystem.io",
    twitter: "https://x.com/TiwiEcosystem",
    telegram: "https://t.me/twc_token",
    bscscan: "https://bscscan.com/token/0xda1060158f7d593667cce0a15db346bb3ffb3596"
  }
};

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
    const identifierLower = identifier.toLowerCase();
    
    // Determine if identifier is a contract address or symbol
    let tokenMetadata;
    
    if (isValidContractAddress(identifierLower, chainLower)) {
      // It's a contract address
      tokenMetadata = getTokenByAddress(identifierLower);
    } else {
      // It's a symbol - specify chain to avoid conflicts with duplicate symbols
      tokenMetadata = getTokenBySymbol(identifierLower, chainLower);
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

    // Get social links from token metadata or fallback
    const socialLinks = tokenMetadata.socials || FALLBACK_SOCIALS[tokenMetadata.symbol] || {
      website: "https://example.com",
      twitter: "https://x.com",
      telegram: "https://t.me",
      bscscan: `https://bscscan.com/token/${tokenMetadata.address}`
    };

    return NextResponse.json(socialLinks);

  } catch (error) {
    console.error('Socials API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social links' },
      { status: 500 }
    );
  }
}
