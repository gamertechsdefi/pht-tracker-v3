import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { tokenName: string } }) {
  // Mapping of token names to social media and other relevant links
  // Note: These are placeholder URLs. Replace with actual URLs for each token.
  const tokenSocialMapping: Record<string, { website: string; twitter: string; telegram: string; bscscan: string }> = {
    pht: {
      website: "https://phoenixtoken.community",
      twitter: "https://x.com/PhoenixToken0",
      telegram: "https://t.me/PhoenixToken0",
      bscscan: "https://bscscan.com/token/0x885c99a787BE6b41cbf964174C771A9f7ec48e04"
    },
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
      twitter: "https://twitter.com/TiwiEcosystem",
      telegram: "https://t.me/twc_token",
      bscscan: "https://bscscan.com/token/0xda1060158f7d593667cce0a15db346bb3ffb3596"
    },
    durt: {
      website: "https://example.com/durt",
      twitter: "https://twitter.com/durt_token",
      telegram: "https://t.me/durt_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    gtan: {
      website: "https://example.com/gtan",
      twitter: "https://twitter.com/gtan_token",
      telegram: "https://t.me/gtan_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    zedek: {
      website: "https://example.com/zedek",
      twitter: "https://twitter.com/zedek_token",
      telegram: "https://t.me/zedek_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    tkc: {
      website: "https://example.com/tkc",
      twitter: "https://twitter.com/tkc_token",
      telegram: "https://t.me/tkc_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    twd: {
      website: "https://example.com/twd",
      twitter: "https://twitter.com/twd_token",
      telegram: "https://t.me/twd_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    bcat: {
      website: "https://example.com/bcat",
      twitter: "https://twitter.com/bcat_token",
      telegram: "https://t.me/bcat_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    nct: {
      website: "https://example.com/nct",
      twitter: "https://twitter.com/nct_token",
      telegram: "https://t.me/nct_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    kitsune: {
      website: "https://example.com/kitsune",
      twitter: "https://twitter.com/kitsune_token",
      telegram: "https://t.me/kitsune_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    bengcat: {
      website: "https://example.com/bengcat",
      twitter: "https://twitter.com/bengcat_token",
      telegram: "https://t.me/bengcat_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    crystalstones: {
      website: "https://example.com/crystalstones",
      twitter: "https://twitter.com/crystalstones_token",
      telegram: "https://t.me/crystalstones_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    bft: {
      website: "https://example.com/bft",
      twitter: "https://twitter.com/bft_token",
      telegram: "https://t.me/bft_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    cross: {
      website: "https://example.com/cross",
      twitter: "https://twitter.com/cross_token",
      telegram: "https://t.me/cross_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    },
    thc: {
      website: "https://example.com/thc",
      twitter: "https://twitter.com/thc_token",
      telegram: "https://t.me/thc_token",
      bscscan: "https://bscscan.com/token/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"
    }
  };

  const tokenName = params.tokenName.toLowerCase();
  const socialLinks = tokenSocialMapping[tokenName] || {
    website: "https://example.com",
    twitter: "https://twitter.com",
    telegram: "https://t.me",
    bscscan: "https://bscscan.com"
  }; // Default to generic URLs if token not found
  
  return NextResponse.json(socialLinks);
}
