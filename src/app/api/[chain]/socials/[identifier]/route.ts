import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenBySymbol, isValidContractAddress } from "@/lib/tokenRegistry";

interface RouteParams {
  chain: string;
  identifier: string;
}

// Fallback social links mapping for tokens that don't have socials in the registry yet
const FALLBACK_SOCIALS: Record<string, { website: string; twitter: string; telegram: string; bscscan: string }> = {
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
    twitter: "https://x.com/TiwiEcosystem",
    telegram: "https://t.me/twc_token",
    bscscan: "https://bscscan.com/token/0xda1060158f7d593667cce0a15db346bb3ffb3596"
  },
  durt: {
    website: "https://example.com/durt",
    twitter: "https://x.com/durt_token",
    telegram: "https://t.me/durt_token",
    bscscan: "https://bscscan.com/token/0x48a510a3394c2a07506d10910ebeff3e25b7a3f1"
  },
  gtan: {
    website: "https://gianttoken.com",
    twitter: "https://x.com/GiantToken",
    telegram: "https://t.me/gianttokenGTAN",
    bscscan: "https://bscscan.com/token/0xbd7909318b9ca4ff140b840f69bb310a785d1095"
  },
  zedek: {
    website: "#",
    twitter: "https://x.com/zedektoken",
    telegram: "https://t.me/zedektoken1",
    bscscan: "https://bscscan.com/token/0xcbeaad74dcb3a4227d0e6e67302402e06c119271"
  },
  tkc: {
    website: "https://thekingdomcoin.io",
    twitter: "https://x.com/thekingdomcoin",
    telegram: "https://t.me/thekingdomcoinofficial",
    bscscan: "https://bscscan.com/token/0x06dc293c250e2fb2416a4276d291803fc74fb9b5"
  },
  twd: {
    website: "https://thewordtoken.com",
    twitter: "https://x.com/NewTWDtoken",
    telegram: "https://t.me/thewordtoken",
    bscscan: "https://bscscan.com/token/0xf00cd9366a13e725ab6764ee6fc8bd21da22786e"
  },
  bcat: {
    website: "https://www.billicatcoin.org",
    twitter: "https://x.com/billicatcoin",
    telegram: "https://t.me/billicatcoin",
    bscscan: "https://bscscan.com/token/0x47a9b109cfb8f89d16e8b34036150ee112572435"
  },
  nct: {
    website: "#",
    twitter: "#",
    telegram: "#",
    bscscan: "#"
  },
  kitsune: {
    website: "https://kitsunetoken.xyz",
    twitter: "https://x.com/kitsunetoken0",
    telegram: "https://t.me/kitsunetokenentry",
    bscscan: "https://bscscan.com/token/0xb6623b503d269f415b9b5c60cdda3aa4fe34fd22"
  },
  bengcat: {
    website: "https://bengcat.fun",
    twitter: "https://x.com/bengalcattoken",
    telegram: "https://t.me/bengalcattoken0",
    bscscan: "https://bscscan.com/token/0xd000815db567372c3c3d7070bef9fb7a9532f9e8"
  },
  crystalstones: {
    website: "https://crystalstones.org",
    twitter: "https://x.com/crystalstones01",
    telegram: "https://t.me/CrystalStones",
    bscscan: "https://bscscan.com/token/0xe252fcb1aa2e0876e9b5f3ed1e15b9b4d11a0b00"
  },
  bft: {
    website: "https://nzvedazbigfive.io",
    twitter: "https://x.com/five_token",
    telegram: "https://t.me/thebigfivetokenchat",
    bscscan: "https://bscscan.com/token/0x4b87f578d6fabf381f43bd2197fbb2a877da6ef8"
  },
  cross: {
    website: "https://crosschainnetwork.icu/",
    twitter: "https://x.com/Crosschainnet",
    telegram: "https://t.me/Crosschainnet",
    bscscan: "https://bscscan.com/token/0x72928a49c4e88f382b0b6ff3e561f56dd75485f9"
  },
  thc: {
    website: "https://transhumancoin.finance",
    twitter: "https://x.com/transhumancoin",
    telegram: "https://t.me/buytranshumancoin",
    bscscan: "https://bscscan.com/token/0x56083560594e314b5cdd1680ec6a493bb851bbd8"
  },
  bbft: {
    website: "https://babybft.com/",
    twitter: "https://x.com/BabyBft",
    telegram: "https://t.me/babybft",
    bscscan: "https://bscscan.com/address/0xfb69e2d3d673a8db9fa74ffc036a8cf641255769",
  },
  bob: {
    website: "https://buildonbnb.com/",
    twitter: "https://x.com/BuildOnBNBBOB",
    telegram: "https://t.me/BuildOnBNBBOB",
    bscscan: "https://bscscan.com/token/0x51363f073b1e4920fda7aa9e9d84ba97ede1560e"
  },
  surv: {
    website: "https://survariumbsc.com/",
    twitter: "https://x.com/SurvariumBSC",
    telegram: "https://t.me/survarium_chat",
    bscscan: "https://bscscan.com/token/0xaff713b62e642b25898e24d5be6561f863582144"
  },
  tut: {
    website: "https://tutorialtoken.com/",
    twitter: "https://x.com/tutorialtoken",
    telegram: "https://t.me/TUTPortal",
    bscscan: "https://bscscan.com/token/0xcaae2a2f939f51d97cdfa9a86e79e3f085b799f3"
  },
  puffcat: {
    website: "https://www.puffcattoken.com/",
    twitter: "https://x.com/puff_cattoken",
    telegram: "https://t.me/puffcatchannel",
    bscscan: "https://bscscan.com/token/0x14a8d0ac8fc456899f2dd33c3f4e32403a78126c"
  },
  crepe: {
    website: "https://www.crepe.fun/",
    twitter: "https://x.com/crepedotfun",
    telegram: "https://t.me/crepefun",
    bscscan: "https://bscscan.com/token/0xeb2b7d5691878627eff20492ca7c9a71228d931d"

  },
  popielno: {
    website: "https://www.popielnotoken.xyz/",
    twitter: "https://x.com/popielno_token",
    telegram: "https://t.me/POPIELNO",
    bscscan: "https://bscscan.com/token/0xdc3d92dd5a468edb7a7772452700cc93bb1826ad",
  },
  spray: {
    website: "",
    twitter: "https://x.com/SprayDURT",
    telegram: "https://t.me/DutchRabbitCoinOfficial",
    bscscan: "https://bscscan.com/token/0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575",
  },
  mbc: {
    website: "https://mambabasketball.online/",
    twitter: "https://x.com/Mambatoken",
    telegram: "https://t.me/longlivemambacoin",
    bscscan: "https://bscscan.com/token/0x170f044f9c7a41FF83CAccaD6CCCa1B941d75Af7",
  },
  mars: {
    website: "http://mataratoken.com/",
    twitter: "https://x.com/captainmatara",
    telegram: "http://t.me/MATARA_TOKEN",
    bscscan: "https://bscscan.com/token/0x6844B2e9afB002d188A072A3ef0FBb068650F214"
  },
  sdc: {
    website: " ",
    twitter: "https://x.com/Side_Chick_SDC",
    telegram: "https://t.me/Sidechickglobal",
    bscscan: "https://bscscan.com/token/0x8cDC41236C567511f84C12Da10805cF50Dcdc27b",
  },
  kind: {
    website: "https://kindcattoken.com",
    twitter: "https://x.com/KindCatToken",
    telegram: "https://t.me/KindCatToken",
    bscscan: "https://bscscan.com/token/0x41f52a42091a6b2146561bf05b722ad1d0e46f8b",
  },
  shibc: {
    website: "https://aishibceo.com",
    twitter: "https://x.com/AIShibCeo",
    telegram: "https://t.me/AISHIBCEOglobal",
    bscscan: "https://bscscan.com/token/0x456B1049bA12f906326891486B2BA93e46Ae0369",
  },
  pcat: {
    website: "#",
    twitter: "https://x.com/phenomenalcat01",
    telegram: "https://t.me/phenomenalcatcoin",
    bscscan: "https://bscscan.com/token/0xFeD56F9Cd29F44e7C61c396DAc95cb3ed33d3546",
  },
  egw: {
    website: "https://eagleswingstoken.com/",
    twitter: "https://x.com/EaglesWingsBSC",
    telegram: "https://t.me/EaglesWingsOfficial",
    bscscan: "https://bscscan.com/token/0x2056d14A4116A7165cfeb7D79dB760a06b57DBCa",
  },
  "1000pdf": {
    website: "https://1000pdf.com/",
    twitter: "http://t.me/pdf1000group",
    telegram: "http://x.com/token1000pdf",
    bscscan: "https://bscscan.com/token/0xCa7930478492CDe4Be997FA898Cd1a6AfB8F41A1",
  },
  aidove: {
    website: "https://www.aidovecoin.com/",
    twitter: "https://x.com/Aidovecoin",
    telegram: "https://t.me/aidovecoin",
    bscscan: "https://bscscan.com/token/0xe9E3CDB871D315fEE80aF4c9FcD4886782694856",
  },
  rbcat: {
    website: "https://www.rbcat.xyz/",
    twitter: "https://x.com/rbcat_bsc",
    telegram: "https://t.me/RBCAT_BSC",
    bscscan: "https://bscscan.com/token/0x14A2db256Ef18c4f7165d5E48f65a528b4155100",
  },
  peso: {
    website: "https://hungrypandapeso.fun/",
    twitter: "https://x.com/pandapeso_cto",
    telegram: "https://t.me/pandapeso",
    bscscan: "https://bscscan.com/token/0xC54CA14328d5b61E4BDc8A4d4b08b6B8D06BC372",
  },
  bbcat: {
    website: "#",
    twitter: "https://x.com/BBillicat",
    telegram: "https://t.me/babybillicat",
    bscscan: "https://bscscan.com/token/0x14A2db256Ef18c4f7165d5E48f65a528b4155100",
  },
  cct: {
    website: "https://www.catcaketoken.com",
    twitter: "https://x.com/CatCakeToken",
    telegram: "https://t.me/catcaketokencct",
    bscscan: "https://bscscan.com/token/0x8489c022a10a8d2a65eb5aF2b0E4aE0191e7916D",
  },
  talent: {
    website: "https://www.talenttoken.fun",
    twitter: "https://x.com/TalentTokes",
    telegram: "https://t.me/talenttokens1",
    bscscan: "https://bscscan.com/token/0x38Aec84f305564cB2625430A294382Cf33e3c317",
  },
  bp: {
    website: "http://babypriceless.com",
    twitter: "http://x.com/Baby_Priceless0",
    telegram: "http://t.me/baby_pricesless_entry",
    bscscan: "https://bscscan.com/token/0xF8418D9144172d43d12938caB74AFa695984062A",
  },
  jawgular: {
    website: "https://jugular.live",
    twitter: "https://x.com/Jawgular",
    telegram: "https://t.me/JAWGULAR",
    bscscan: "https://bscscan.com/token/0x73cD10B66c4EBC6eE77ADFcc4310C03D79a74444",
  },
  dst: {
    website: "https://www.daystartoken.online/",
    twitter: "https://x.com/DayStarToken",
    telegram: "https://t.me/DayStarToken1",
    bscscan: "https://bscscan.com/token/0x39B4cBC1CE609D736E9aC3BaDd98E95c890731F3",
  },
  peperice: {
    website: "https://www.peperice.com",
    twitter: "https://x.com/peperice_bnb",
    telegram: "https://t.me/peperice",
    bscscan: "https://bscscan.com/token/0x5f3170D7A37D70FFE92a3e573ec67400b795B854",  
  },
  zoe: {
    website: "https://www.zoetoken.site",
    twitter: "https://x.com/Zoetoken_zt",
    telegram: "https://t.me/zoetokens",
    bscscan: "https://bscscan.com/token/0x034437C7037317eaAbA782f2aD5B0A54cFcCf726",  
  },
  godinu: {
    website: "https://www.godinu.vip",
    twitter: "https://x.com/GodInuBSC",
    telegram: "https://t.me/godinubnb",
    bscscan: "https://bscscan.com/token/0xfd8eab4F5cf3572Ae62445CAD634226DbaA37F69",  
  },

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
