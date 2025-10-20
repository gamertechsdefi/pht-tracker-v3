"use client";


import Header from '@/components/Header';
import { TOKEN_REGISTRY } from '@/lib/tokenRegistry';

import React, { useState, useEffect, useCallback } from 'react';

// Define interfaces for our data structures
interface TokenData {
  id: string;
  symbol: string;
  name: string;
  price?: string;
  marketCap?: string;
  volume24h?: string;
  priceChange24h?: string;
  image?: string;
  isTop100?: boolean;
  isMeme?: boolean;
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

interface CoinGeckoCoinData {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; };
  market_data: {
    current_price: { usd: number; };
    market_cap: { usd: number; };
    total_volume: { usd: number; };
    price_change_percentage_24h: number;
    ath_market_cap: { usd: number; };
  };
}

// Token list with chain mapping
const TOKEN_LIST: { [key: string]: string } = {
  pht: "bsc",
  wkc: "bsc",
  dtg: "bsc",
  war: "bsc",
  yukan: "bsc",
  btcdragon: "bsc",
  ocicat: "bsc",
  nene: "bsc",
  twc: "bsc",
  durt: "bsc",
  gtan: "bsc",
  zedek: "bsc",
  tkc: "bsc",
  twd: "bsc",
  bcat: "bsc",
  bengcat: "bsc",
  nct: "bsc",
  kitsune: "bsc",
  bft: "bsc",
  crystalstones: "bsc",
  cross: "bsc",
  thc: "bsc",
  bbft: "bsc",
  surv: "bsc",
  bob: "bsc",
  tut: "bsc",
  puffcat: "bsc",
  crepe: "bsc",
  popielno: "bsc",
  spray: "bsc",
  mars: "bsc",
  sdc: "bsc",
  kind: "bsc",
  shibc: "bsc",
  pcat: "bsc",
  egw: "bsc",
  "1000pdf": "bsc",
  aidove: "bsc",
  hmt: "bsc",
  rbcat: "bsc",
  bbcat: "bsc",
  talent: "bsc",
  "p-cat": "bsc",
    jawgular: "bsc",
    dst: "bsc",
    zoe: "bsc",
    godinu: "bsc",
    peperice: "bsc",
    bp: "bsc",
    lai: "bsc",
    babydew: "bsc",
    sat: "bsc",
    orb: "bsc",
    captainbnb: "bsc",
    anndy: "bsc",
    light: "bsc",



};

// Full name to symbol mapping
const FULL_NAME_MAP: { [key: string]: string } = {
  "Phoenix Token": "pht",
  "WikiCat Coin ": "wkc",
  "Defi Tiger Token": "dtg",
  "Water Rabbit Token": "war",
  "Yukan Token": "yukan",
  "BTC Dragon Token": "btcdragon",
  "OciCat Token": "ocicat",
  "Nene": "nene",
  "TIWI CAT": "twc",
  "The Word Token": "twd",
  "The Kingdom Coin": "tkc",
  "Dutch Rabbit": "durt",
  "Giant Token": "gtan",
  "Zedek Token": "zedek",
  "Billicat Token ": "bcat",
  "Bengal Cat Token": "bengcat",
  "New Cat Token": "nct",
  "Kitsune Token": "kitsune",
  "Crystal Stones": "crystalstones",
  "The Big Five Token": "bft",
  "Cross Token": "cross",
  "Transhuman Coin": "thc",
  "Baby BFT": "bbft",
  "Survarium": "surv",
  "Build on BNB": "bob",
  "Tutorial Token": "tut",
  "PuffCat Token": "puffcat",
  "CREPE": "crepe",
  "POPIELNO": "popielno",
  "SPRAY LOTTERY TOKEN": "spray",
  "Matara Token": "mars",
  "sdc": "SIDE CHICK",
  "kind": "KIND CAT TOKEN",
  "shibc": "AIShibCeo",
  "pcat": "Phenomenal Cat",
  "egw": "Eagles Wings",
  "1000pdf": "1000PDF",
  "peso": "Panda Peso",
  "aidove": "Aidove",
  "hmt": "HawkMoon Token",
  "rbcat": "Russian Blue Cat",
  "bbcat": "Baby BilliCat",
  "talent": "Talent Token",
  "p-cat": "Persian Cat Token",
  "ZOE Token": "zoe",
    "JAWGULAR": "jawgular",
    "GOD INU": "godinu",
    "Pepe Rice": "peperice",
    "DayStar Token": "dst",
    "Baby Priceless": "bp",
    "LeadAI Token": "lai",
    "BABY DEW": "babydew",
    "SATERIA": "sat",    
    "ORBITAL": "orb",
    "CaptainBNB": "captainbnb",
    "首席模因官": "anndy",
    "Liminous Token": "light",
};

const TOKENS = Object.entries(TOKEN_LIST).map(([symbol, chain]) => {
  const name = Object.keys(FULL_NAME_MAP).find(name => FULL_NAME_MAP[name] === symbol) || symbol.toUpperCase();
  return {
    id: symbol,
    symbol: symbol.toUpperCase(),
    name,
    chain,
  }
});

const formatMarketCap = (marketCap: string | undefined): string => {
  if (!marketCap) return '$0';
  const mc = parseFloat(marketCap);
  if (mc >= 1_000_000_000) {
    return `$${(mc / 1_000_000_000).toFixed(2)}B`;
  }
  if (mc >= 1_000_000) {
    return `$${(mc / 1_000_000).toFixed(2)}M`;
  }
  if (mc >= 1_000) {
    return `$${(mc / 1_000).toFixed(2)}K`;
  }
  return `$${mc.toFixed(2)}`;
};


const PriceComparison = () => {
  const [cryptoA, setCryptoA] = useState<string>('pht');
  const [cryptoB, setCryptoB] = useState<string>('btc');
  const [cryptoAData, setCryptoAData] = useState<TokenData | null>(null);
  const [cryptoBData, setCryptoBData] = useState<TokenData | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTokens, setLoadingTokens] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'now' | 'ath'>('now');
  const [searchTermA, setSearchTermA] = useState('');
  const [searchTermB, setSearchTermB] = useState('');
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);
  const [activeTab, setActiveTab] = useState<'top100' | 'meme'>('top100');

  const fetchTokenData = useCallback(async (tokenId: string, timeframe: 'now' | 'ath' = 'now'): Promise<TokenData | null> => {
    const isPlatformToken = TOKENS.some(t => t.id === tokenId);

    if (isPlatformToken) {
      // Find the contract address for the platform token
      // Try to match by symbol (id) in the registry
      const tokenMeta = TOKEN_REGISTRY.find(
        (t) => t.symbol.toLowerCase() === tokenId.toLowerCase() && t.chain === 'bsc'
      );
      if (!tokenMeta) {
        console.error(`No contract address found for platform token: ${tokenId}`);
        return null;
      }
      try {
        // Fetch directly from Dexscreener API using the contract address
        const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenMeta.address}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data from Dexscreener for ${tokenId}`);
        }
        const dexData = await response.json();
        // Parse Dexscreener response (assume first pair is the most relevant)
        const pair = dexData.pairs && dexData.pairs.length > 0 ? dexData.pairs[0] : null;
        if (!pair) {
          throw new Error(`No pair data found on Dexscreener for ${tokenId}`);
        }
        return {
          id: tokenId,
          symbol: pair.baseToken?.symbol || tokenMeta.symbol.toUpperCase() || '',
          name: pair.baseToken?.name || tokenMeta.name || '',
          price: pair.priceUsd || '0',
          marketCap: pair.fdv || '0',
          volume24h: pair.volume?.h24 || '0',
          priceChange24h: pair.priceChange?.h24 || '0',
          image: pair.baseToken?.logoURI || '',
        };
      } catch (err) {
        console.error(`Error fetching Dexscreener data for ${tokenId}:`, err);
        return null;
      }
    } else {
      // It might be a coingecko token
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${tokenId}`);
        if (!response.ok) {
          return null;
        }
        const data: CoinGeckoCoinData = await response.json();
        const athMarketCap = data.market_data.ath_market_cap?.usd;
        const marketCap = timeframe === 'ath' && athMarketCap !== undefined && athMarketCap !== null
          ? athMarketCap.toString()
          : data.market_data.market_cap.usd.toString();

        return {
          id: data.id,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          price: data.market_data.current_price.usd.toString(),
          marketCap: marketCap,
          volume24h: data.market_data.total_volume.usd.toString(),
          priceChange24h: data.market_data.price_change_percentage_24h.toString(),
          image: data.image.large,
          isTop100: true,
        }

      } catch (err) {
        console.error(`Error fetching coingecko token ${tokenId}:`, err);
        return null;
      }
    }
  }, []);

  const fetchTokenLists = useCallback(async () => {
    try {
      setLoadingTokens(true);
      const platformTokens = TOKENS.map(token => ({ ...token, isTop100: false, isMeme: false }));

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch top 100 tokens from CoinGecko');
      }
      const top100Data: CoinGeckoMarketData[] = await response.json();
      const top100Tokens = top100Data.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        isTop100: true,
        isMeme: false,
      }));

      const meme_response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token'
      );
      if (!meme_response.ok) {
        throw new Error('Failed to fetch meme tokens from CoinGecko');
      }
      const memeData: CoinGeckoMarketData[] = await meme_response.json();
      const memeTokens = memeData.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        isTop100: false,
        isMeme: true,
      }));

      const platformTokenIds = new Set(platformTokens.map(t => t.id));
      const uniqueTop100Tokens = top100Tokens.filter(t => !platformTokenIds.has(t.id));

      const existingIds = new Set([...platformTokens.map(t => t.id), ...uniqueTop100Tokens.map(t => t.id)]);
      const uniqueMemeTokens = memeTokens.filter(t => !existingIds.has(t.id));

      const allTokens = [...platformTokens, ...uniqueTop100Tokens, ...uniqueMemeTokens];

      setTokens(allTokens);

    } catch (error) {
      console.error('Error fetching token lists:', error);
      setError('Failed to load token lists. Please try again later.');
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenLists();
  }, [fetchTokenLists]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dataA, dataB] = await Promise.all([
          fetchTokenData(cryptoA, 'now'),
          fetchTokenData(cryptoB, timeframe)
        ]);
        setCryptoAData(dataA);
        setCryptoBData(dataB);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (tokens.length > 0) {
      fetchInitialData();
    }
  }, [cryptoA, cryptoB, fetchTokenData, tokens, timeframe]);


  const calculateAdjustedPrice = useCallback((tokenA: TokenData | null, tokenB: TokenData | null): number => {
    if (!tokenA || !tokenB || !tokenA.price || !tokenB.marketCap) return 0;

    const priceA = parseFloat(tokenA.price);
    const marketCapB = parseFloat(tokenB.marketCap);

    if (priceA <= 0 || marketCapB <= 0) return 0;

    const potentialPrice = marketCapB / (parseFloat(tokenA.marketCap || '0') / priceA);

    return potentialPrice;
  }, []);

  const handleShare = async () => {
    if (!cryptoAData || !cryptoBData) return;

    try {
      const potentialPrice = calculateAdjustedPrice(cryptoAData, cryptoBData);
      const shareData = {
        title: `${cryptoAData.name} (${cryptoAData.symbol}) with ${cryptoBData.name}'s Market Cap`,
        text: `If ${cryptoAData.name} had ${cryptoBData.name}'s market cap, its price would be ${potentialPrice.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const renderTokenSelect = (type: 'from' | 'to'): React.ReactElement => {
    const isFrom = type === 'from';
    const selectedTokenId = isFrom ? cryptoA : cryptoB;
    const setSelectedToken = isFrom ? setCryptoA : setCryptoB;
    const searchTerm = isFrom ? searchTermA : searchTermB;
    const setSearchTerm = isFrom ? setSearchTermA : setSearchTermB;
    const showDropdown = isFrom ? showDropdownA : showDropdownB;
    const setShowDropdown = isFrom ? setShowDropdownA : setShowDropdownB;
    const selectedTokenData = (isFrom ? cryptoAData : cryptoBData);

    const searchLower = searchTerm.toLowerCase();

    const platformTokens = tokens.filter(t => !t.isTop100 && !t.isMeme);
    const top100Tokens = tokens.filter(t => t.isTop100);
    const memeTokens = tokens.filter(t => t.isMeme);

    const filteredPlatformTokens = platformTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchLower) || token.name.toLowerCase().includes(searchLower)
    );

    const filteredTop100Tokens = top100Tokens.filter(token =>
      token.symbol.toLowerCase().includes(searchLower) || token.name.toLowerCase().includes(searchLower)
    );

    const filteredMemeTokens = memeTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchLower) || token.name.toLowerCase().includes(searchLower)
    );

    const handleSelect = (tokenId: string) => {
  setSelectedToken(tokenId);
  const tokenInfo = tokens.find(t => t.id === tokenId);
  setSearchTerm(tokenInfo?.symbol || ''); // Set to symbol, not name
  setShowDropdown(false);
    };

    const handleFocus = () => {
      setShowDropdown(true);
      setSearchTerm('');
    };

    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-2 pl-3 pr-10 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder={loadingTokens ? 'Loading tokens...' : `Search ${type === 'from' ? 'Token A' : 'Token B'}`}
            value={showDropdown ? searchTerm : selectedTokenData?.symbol || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleFocus}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            disabled={loadingTokens}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-neutral-800 rounded-md shadow-lg max-h-96 overflow-auto">
            {filteredPlatformTokens.length === 0 && filteredTop100Tokens.length === 0 && filteredMemeTokens.length === 0 ? (
              <div className="px-4 py-2 text-neutral-400">No tokens found</div>
            ) : (
              <div>
                {type === 'from' && filteredPlatformTokens.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">Platform Tokens</div>
                    {filteredPlatformTokens.map((token) => (
                      <div
                        key={token.id}
                        className={`px-4 py-2 hover:bg-neutral-700 cursor-pointer flex items-center ${selectedTokenId === token.id ? 'bg-neutral-700' : ''
                          }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(token.id);
                        }}
                      >
                        {token.image && (
                          <img src={token.image} alt={token.name} className="w-5 h-5 mr-2 rounded-full" />
                        )}
                        <span className="font-medium">{token.symbol}</span>
                      </div>
                    ))}
                  </div>
                )}
                {type === 'to' && (
                  <>
                    <div className="flex border-b border-neutral-700 sticky top-0 bg-neutral-800">
                      <button
                        className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'top100' ? 'text-white border-b-2 border-orange-500' : 'text-neutral-400'}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveTab('top100')}
                      >
                        Top 100
                      </button>
                      <button
                        className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'meme' ? 'text-white border-b-2 border-orange-500' : 'text-neutral-400'}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveTab('meme')}
                      >
                        Meme
                      </button>
                    </div>
                    {activeTab === 'top100' && (
                      <div>
                        {filteredTop100Tokens.map((token) => (
                          <div
                            key={token.id}
                            className={`px-4 py-2 hover:bg-neutral-700 cursor-pointer flex items-center ${selectedTokenId === token.id ? 'bg-neutral-700' : ''
                              }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelect(token.id);
                            }}
                          >
                            {token.image && (
                              <img src={token.image} alt={token.name} className="w-5 h-5 mr-2 rounded-full" />
                            )}
                            <span className="font-medium">{token.symbol}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'meme' && (
                      <div>
                        {filteredMemeTokens.map((token) => (
                          <div
                            key={token.id}
                            className={`px-4 py-2 hover:bg-neutral-700 cursor-pointer flex items-center ${selectedTokenId === token.id ? 'bg-neutral-700' : ''
                              }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelect(token.id);
                            }}
                          >
                            {token.image && (
                              <img src={token.image} alt={token.name} className="w-5 h-5 mr-2 rounded-full" />
                            )}
                            <span className="font-medium">{token.symbol}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderComparison = (): React.ReactElement => {
    if (loading || loadingTokens) {
      return <div className="text-center py-8">Loading token data...</div>;
    }

    if (error) {
      return <div className="text-center text-red-500 py-8">{error}</div>;
    }

    if (!cryptoAData || !cryptoBData) {
      return <div className="text-center text-neutral-400 py-8">Select tokens to compare</div>;
    }

    const currentPrice = parseFloat(cryptoAData.price || '0');
    const potentialPrice = calculateAdjustedPrice(cryptoAData, cryptoBData);
    const priceDifference = potentialPrice - currentPrice;
    const percentageDifference = currentPrice > 0 ? (priceDifference / currentPrice) * 100 : 0;
    const multiplier = currentPrice > 0 ? potentialPrice / currentPrice : 0;

    return (
      <div className="text-center">
        <div className="flex items-center justify-center mb-2 space-x-2">
          {cryptoAData.image && <img src={cryptoAData.image} alt={cryptoAData.name} className="w-8 h-8 rounded-md" />}
          <h2 className="text-xl md:text-2xl font-bold">
            {cryptoAData.symbol} (${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 4 })})
          </h2>
        </div>
        <div className="text-xl">
          with {cryptoBData.symbol}&apos;s {timeframe === 'ath' ? 'ATH ' : ''}market cap of
          <span className="font-bold"> {formatMarketCap(cryptoBData.marketCap)}</span>:
        </div>

        <div className="text-2xl font-bold text-green-400">
          ${potentialPrice.toLocaleString(undefined, { minimumFractionDigits: 7 })}
        </div>

        <div className={`text-2xl ${percentageDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {multiplier.toFixed(2)}x
        </div>

        <div className="text-sm text-neutral-400 mt-2">
          {cryptoAData.symbol} needs a {percentageDifference > 0 ?
            `${(percentageDifference).toLocaleString(undefined, { maximumFractionDigits: 0 })}% increase` :
            `${Math.abs(percentageDifference).toLocaleString(undefined, { maximumFractionDigits: 0 })}% decrease`}
          <br />
          to reach {cryptoBData.name}&apos;s market cap
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white">
      <Header />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl pt-8 font-bold text-center mb-8 bg-gradient-to-b from-orange-500 to-red-600 text-transparent bg-clip-text">
          PRICE & INCREASE TOOL
        </h1>

        <div className="bg-neutral-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-row gap-6 mb-8">
            <div className="w-full md:w-1/2">
              <h2 className="text-sm md:text-lg font-semibold mb-3">Select Token</h2>
              {renderTokenSelect('from')}
              {cryptoAData && (
                <div className="mt-2 text-sm text-neutral-400">
                  Current Market Cap: {formatMarketCap(cryptoAData.marketCap)}
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2">
              <h2 className="text-sm md:text-lg font-semibold mb-3">Compare With</h2>
              {renderTokenSelect('to')}
              {cryptoBData && (
                <div className="mt-2 text-sm text-neutral-400">
                  Current Market Cap: {formatMarketCap(cryptoBData.marketCap)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-700 rounded-lg p-6">
            {renderComparison()}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setTimeframe('now')}
              className={`px-6 py-3 rounded-lg font-medium ${timeframe === 'now'
                ? 'bg-orange-600 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
            >
              Current Price
            </button>
            <button
              onClick={() => setTimeframe('ath')}
              className={`px-6 py-3 rounded-lg font-medium ${timeframe === 'ath'
                ? 'bg-orange-600 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
            >
              All-Time High
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <span>Share Comparison</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>

            <a
              href={`/bsc/${cryptoA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-medium text-center"
            >
              View {cryptoAData?.symbol}
            </a>
          </div>
        </div>

        {/* <div className="mt-8 text-center text-sm text-neutral-400">
          <p>Data provided by local API</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div> */}
      </div>
    </div>
  );
};

export default PriceComparison;
