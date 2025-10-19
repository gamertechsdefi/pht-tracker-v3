// Comprehensive token metadata interface
export interface SocialLinks {
  website: string;
  twitter: string;
  telegram: string;
  bscscan: string;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  chain: 'bsc' | 'sol';
  decimals?: number;
  socials?: SocialLinks;
}

// Centralized token registry - single source of truth
export const TOKEN_REGISTRY: TokenMetadata[] = [
  // BSC Tokens
  {
    address: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
    symbol: "pht",
    name: "Phoenix Token",
    chain: "bsc",
    socials: {
      website: "https://phoenixtoken.community",
      twitter: "https://x.com/PhoenixToken0",
      telegram: "https://t.me/PhoenixToken0",
      bscscan: "https://bscscan.com/token/0x885c99a787BE6b41cbf964174C771A9f7ec48e04"
    }
  },
  { address: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb", symbol: "wkc", name: "WikiCat Coin", chain: "bsc" },
  { address: "0x57bfe2af99aeb7a3de3bc0c42c22353742bfd20d", symbol: "war", name: "Water Rabbit Token", chain: "bsc" },
  { address: "0xb1957BDbA889686EbdE631DF970ecE6A7571A1B6", symbol: "dtg", name: "Defi Tiger Token", chain: "bsc" },
  { address: "0xd086B849a71867731D74D6bB5Df4f640de900171", symbol: "yukan", name: "Yukan Token", chain: "bsc" },
  { address: "0x1ee8a2f28586e542af677eb15fd00430f98d8fd8", symbol: "btcdragon", name: "BTCDragon Token", chain: "bsc" },
  { address: "0xE53D384Cf33294C1882227ae4f90D64cF2a5dB70", symbol: "ocicat", name: "Ocicat Token", chain: "bsc" },
  { address: "0x551877C1A3378c3A4b697bE7f5f7111E88Ab4Af3", symbol: "nene", name: "Nene Token", chain: "bsc" },
  { address: "0xDA1060158F7D593667cCE0a15DB346BB3FfB3596", symbol: "twc", name: "TIWICAT", chain: "bsc" },
  { address: "0x06Dc293c250e2fB2416A4276d291803fc74fb9B5", symbol: "tkc", name: "The Kingdom Coin", chain: "bsc" },
  { address: "0x48a510A3394C2A07506d10910EBEFf3E25b7a3f1", symbol: "durt", name: "Dutch Rabbit Token", chain: "bsc" },
  { address: "0xf00cD9366A13e725AB6764EE6FC8Bd21dA22786e", symbol: "twd", name: "The Word Token", chain: "bsc" },
  { address: "0xbD7909318b9Ca4ff140B840F69bB310a785d1095", symbol: "gtan", name: "Giant Token", chain: "bsc" },
  { address: "0xCbEaaD74dcB3a4227D0E6e67302402E06c119271", symbol: "zedek", name: "Zedek Token", chain: "bsc" },
  { address: "0xD000815DB567372C3C3d7070bEF9fB7a9532F9e8", symbol: "bengcat", name: "Bengal Cat Token", chain: "bsc" },
  { address: "0x47a9B109Cfb8f89D16e8B34036150eE112572435", symbol: "bcat", name: "BilliCat Token", chain: "bsc" },
  { address: "0x9F1f27179fB25F11e1F8113Be830cfF5926C4605", symbol: "nct", name: "New Cat Token", chain: "bsc" },
  { address: "0xb6623B503d269f415B9B5c60CDDa3Aa4fE34Fd22", symbol: "kitsune", name: "Kitsune Token", chain: "bsc" },
  { address: "0xe252FCb1Aa2E0876E9B5f3eD1e15B9b4d11A0b00", symbol: "crystalstones", name: "Crystal Stones", chain: "bsc" },
  { address: "0x4b87F578d6FaBf381f43bd2197fBB2A877da6ef8", symbol: "bft", name: "Big Five Token", chain: "bsc" },
  { address: "0x72928a49c4E88F382b0b6fF3E561F56Dd75485F9", symbol: "cross", name: "Cross Token", chain: "bsc" },
  { address: "0x56083560594E314b5cDd1680eC6a493bb851BBd8", symbol: "thc", name: "Transhuman Coin", chain: "bsc" },
  { address: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769", symbol: "bbft", name: "Baby BFT", chain: "bsc" },
  { address: "0x51363f073b1e4920fda7aa9e9d84ba97ede1560e", symbol: "bob", name: "Build on BNB", chain: "bsc" },
  { address: "0xAfF713b62e642b25898e24d5Be6561f863582144", symbol: "surv", name: "Survarium", chain: "bsc" },
  { address: "0xCAAE2A2F939F51d97CdFa9A86e79e3F085b799f3", symbol: "tut", name: "Tutorial Token", chain: "bsc" },
  { address: "0x14a8d0AC8Fc456899F2DD33C3f4E32403A78126c", symbol: "puffcat", name: "PuffCat Token", chain: "bsc" },
  { address: "0xeb2B7d5691878627eff20492cA7c9a71228d931D", symbol: "crepe", name: "CREPE", chain: "bsc" },
  { address: "0xdc3d92dd5a468edb7a7772452700cc93bb1826ad", symbol: "popielno", name: "POPIELNO", chain: "bsc" },
  { address: "0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575", symbol: "spray", name: "SPRAY LOTTERY TOKEN", chain: "bsc" },
  { address: "0x170f044f9c7a41ff83caccad6ccca1b941d75af7", symbol: "mbc", name: "Mamba Token", chain: "bsc" },
  { address: "0x6844b2e9afb002d188a072a3ef0fbb068650f214", symbol: "mars", name: "Matara Token", chain: "bsc" },
  { address: "0x8cDC41236C567511f84C12Da10805cF50Dcdc27b", symbol: "sdc", name: "SIDE CHICK", chain: "bsc" },
  { address: "0x41f52a42091a6b2146561bf05b722ad1d0e46f8b", symbol: "kind", name: "KIND CAT TOKEN", chain: "bsc" },
  { address: "0x456B1049bA12f906326891486B2BA93e46Ae0369", symbol: "shibc", name: "AIShibCeo", chain: "bsc" },
  { address: "0xFeD56F9Cd29F44e7C61c396DAc95cb3ed33d3546", symbol: "pcat", name: "Phenomenal Cat", chain: "bsc" },
  { address: "0x2056d14A4116A7165cfeb7D79dB760a06b57DBCa", symbol: "egw", name: "Eagles Wings", chain: "bsc" },
  { address: "0xCa7930478492CDe4Be997FA898Cd1a6AfB8F41A1", symbol: "1000pdf", name: "1000PDF", chain: "bsc" },
  { address: "0xe9E3CDB871D315fEE80aF4c9FcD4886782694856", symbol: "aidove", name: "AiDove", chain: "bsc" },
  { address: "0x360f2cf415d9be6e82a7252681ac116fb63d2fa2", symbol: "hmt", name: "HawkMoon Token", chain: "bsc" },
  { address: "0x14A2db256Ef18c4f7165d5E48f65a528b4155100", symbol: "rbcat", name: "Russian Blue Cat", chain: "bsc" },
  { address: "0x32Eb603F30ba75052f608CFcbAC45e39B5eF9beC", symbol: "bbcat", name: "Baby BilliCat", chain: "bsc" },
  { address: "0x8489c022a10a8d2a65eb5aF2b0E4aE0191e7916D", symbol: "cct", name: "CatCake Token", chain: "bsc" },
  { address: "0x38Aec84f305564cB2625430A294382Cf33e3c317", symbol: "talent", name: "Talent Token", chain: "bsc" },
  { address: "0x71fd83d49fAaD4612E9d35876A75a97a5aDd4Bc2", symbol: "pcat", name: "Persian Cat Token", chain: "bsc" },
  {address: "0xF8418D9144172d43d12938caB74AFa695984062A", symbol: "bp", name: "Baby Priceless", chain: "bsc" },
  {address: "0x73cD10B66c4EBC6eE77ADFcc4310C03D79a74444", symbol: "jawgular", name: "JAWGULAR", chain: "bsc" },
  { address: "0x39B4cBC1CE609D736E9aC3BaDd98E95c890731F3", symbol: "dst", name: "DayStar Token", chain: "bsc"},
  { address: "0x5f3170D7A37D70FFE92a3e573ec67400b795B854", symbol: "peperice", name: "Pepe Rice", chain: "bsc" },
  { address: "0xfd8eab4F5cf3572Ae62445CAD634226DbaA37F69", symbol: "godinu",  name: "GOD INU", chain: "bsc" },
  { address: "0x034437C7037317eaAbA782f2aD5B0A54cFcCf726", symbol: "zoe", name: "ZOE Token", chain: "bsc" } ,
  { address: "0x90206Ad9b7d23c672cd75A633CA96b5D9e9AE8Ed", symbol: "lai", name: "LeadAI Token", chain: "bsc" },
  { address: "0x45c0f77541d195a6dea20a681e6c02a94ca04dd0", symbol: "babydew", name: "BABY DEW", chain: "bsc" },
  { address: "0x4ff377aad0c67541aa12ece8b12d1217f3c94444", symbol: "sat", name: "SATERIA", chain: "bsc" },
  { address: "0x218ce180c6b21a355a55cdbb5b3b3bf7aad5c8a5", symbol: "orb", name: "ORBITAL", chain: "bsc" },
  { address: "0x47A1EB0b825b73e6A14807BEaECAFef199d5477c", symbol: "CaptainBNB", name: "Captain BNB", chain: "bsc" },
  { address: "0xDc11726C4efa126CFe9614408CD310B22fe74444", symbol: "anndy", name: "首席模因官", chain: "bsc" },
  
  
  // Solana Tokens (placeholder addresses - replace with actual Solana addresses)
  { address: "scat_solana_address_placeholder", symbol: "scat", name: "Solana Cat Token", chain: "sol" },
  { address: "petros_solana_address_placeholder", symbol: "petros", name: "Petros Token", chain: "sol" },
  { address: "nuke_solana_address_placeholder", symbol: "nuke", name: "Nuke Token", chain: "sol" },
  { address: "venus_solana_address_placeholder", symbol: "venus", name: "Two Face Cat", chain: "sol" },
];

// Utility functions for token lookups
export function getTokenByAddress(address: string): TokenMetadata | undefined {
  return TOKEN_REGISTRY.find(token => 
    token.address.toLowerCase() === address.toLowerCase()
  );
}

export function getTokenBySymbol(symbol: string, chain?: 'bsc' | 'sol'): TokenMetadata | undefined {
  const tokens = TOKEN_REGISTRY.filter(token =>
    token.symbol.toLowerCase() === symbol.toLowerCase() &&
    (chain ? token.chain === chain : true)
  );

  // If multiple tokens with same symbol, prefer BSC tokens or return first match
  if (tokens.length > 1) {
    return tokens.find(token => token.chain === 'bsc') || tokens[0];
  }

  return tokens[0];
}

export function getTokensBySymbol(symbol: string): TokenMetadata[] {
  return TOKEN_REGISTRY.filter(token =>
    token.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getTokensByChain(chain: 'bsc' | 'sol'): TokenMetadata[] {
  return TOKEN_REGISTRY.filter(token => token.chain === chain);
}

export function isValidContractAddress(address: string, chain: 'bsc' | 'sol'): boolean {
  if (chain === 'bsc') {
    // EVM address validation: 42 characters, starts with 0x, followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } else if (chain === 'sol') {
    // Solana address validation: 32-44 characters, base58 encoded
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  return false;
}

// Address-to-symbol mapping for quick lookups
export const ADDRESS_TO_SYMBOL_MAP: Record<string, string> = TOKEN_REGISTRY.reduce((acc, token) => {
  acc[token.address.toLowerCase()] = token.symbol;
  return acc;
}, {} as Record<string, string>);

// Symbol-to-address mapping for backward compatibility (handles duplicates by preferring BSC)
export const SYMBOL_TO_ADDRESS_MAP: Record<string, string> = {};
TOKEN_REGISTRY.forEach(token => {
  const symbolKey = token.symbol.toLowerCase();
  // Only set if not already set, or if current token is BSC and existing is not
  if (!SYMBOL_TO_ADDRESS_MAP[symbolKey] ||
      (token.chain === 'bsc' && getTokenByAddress(SYMBOL_TO_ADDRESS_MAP[symbolKey])?.chain !== 'bsc')) {
    SYMBOL_TO_ADDRESS_MAP[symbolKey] = token.address;
  }
});

// Legacy support - maps old symbol-based lookups to new address-based system (handles duplicates)
export const TOKEN_MAP: Record<string, { address: string }> = {};
TOKEN_REGISTRY.forEach(token => {
  // Only set if not already set, or if current token is BSC and existing is not
  if (!TOKEN_MAP[token.symbol] ||
      (token.chain === 'bsc' && getTokenByAddress(TOKEN_MAP[token.symbol].address)?.chain !== 'bsc')) {
    TOKEN_MAP[token.symbol] = { address: token.address };
  }
});
