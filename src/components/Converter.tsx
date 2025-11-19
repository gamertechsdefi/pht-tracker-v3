// components/Converter.tsx

import React, { useState, useEffect } from 'react';

interface CurrencyConverterProps {
  tokenSymbol: string;
  tokenAddress: string;
  tokenLogoUrl?: string;
  chain?: string;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  tokenSymbol,
  tokenAddress,
  tokenLogoUrl,
  chain = 'bsc'
}) => {
  const [inputValue, setInputValue] = useState('1');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [outputValue, setOutputValue] = useState('0.000000000');
  const [rates, setRates] = useState<{ usd: number; bnb: number }>({ usd: 0, bnb: 0 });
  const [loading, setLoading] = useState(true);

  // Determine native currency label based on chain
  const nativeCurrency = chain === 'sol' ? 'SOL' : 'WBNB';
  const showNativeCurrency = chain !== 'rwa'; // Hide native currency for RWA

  useEffect(() => {
    const fetchRates = async () => {
      try {
        console.log('Fetching rates for token:', tokenAddress, 'chain:', chain);
        
        // For RWA tokens, use the internal API which handles AssetChain
        if (chain === 'rwa') {
          const response = await fetch(`/api/${chain}/token-price/${tokenAddress}`);
          
          if (!response.ok) {
            console.error('API Error:', await response.text());
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('RWA Token Price API Response:', data);
          
          // The API returns { price: number, lastUpdated: string }
          const usdRate = data.price || 0;
          
          // For RWA, we don't have BNB pricing, set to 0
          const bnbRate = 0;
          
          console.log('Parsed RWA rates - USD:', usdRate);
          
          setRates({
            usd: usdRate,
            bnb: bnbRate,
          });
          setLoading(false);
          return;
        }
        
        // For BSC/SOL tokens, use DexScreener API
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
        );
        
        if (!response.ok) {
          console.error('API Error:', await response.text());
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('DexScreener API Response:', data);
        
        // DexScreener returns pairs, filter by chain
        const chainId = chain === 'bsc' ? ['bsc', 'binance'] : [chain];
        const pairs = data.pairs?.filter((pair: any) => 
          chainId.includes(pair.chainId)
        ) || [];
        
        // Sort by liquidity and get the most liquid pair
        const mainPair = pairs.sort((a: any, b: any) => 
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0];
        
        if (!mainPair) {
          console.error(`No ${chain} pairs found for this token`);
          setLoading(false);
          return;
        }
        
        // Get USD price directly from DexScreener
        const usdRate = parseFloat(mainPair.priceUsd) || 0;
        
        // Get native token price (BNB for BSC, SOL for Solana)
        const bnbRate = parseFloat(mainPair.priceNative) || 0;
        
        console.log('Parsed rates - USD:', usdRate, 'Native:', bnbRate);
        console.log('Pair info:', {
          dex: mainPair.dexId,
          liquidity: mainPair.liquidity?.usd,
          pairAddress: mainPair.pairAddress
        });
        
        setRates({
          usd: usdRate,
          bnb: bnbRate,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rates:', error);
        setLoading(false);
      }
    };
    fetchRates();
  }, [tokenAddress, chain]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseFloat(value);
    
    // Debug log
    console.log('Input changed:', { 
      value, 
      numValue, 
      selectedCurrency, 
      rates, 
      rate: selectedCurrency === 'USD' ? rates.usd : rates.bnb 
    });
    
    const rate = selectedCurrency === 'USD' ? rates.usd : rates.bnb;
    const converted = isNaN(numValue) || rate === 0 ? 0 : numValue * rate;
    setOutputValue(converted.toFixed(9));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
    // Recalculate output with new currency
    const numValue = parseFloat(inputValue);
    const rate = e.target.value === 'USD' ? rates.usd : rates.bnb;
    const converted = isNaN(numValue) ? 0 : numValue * rate;
    setOutputValue(converted.toFixed(9));
  };

  return (
    <div className="mt-4 bg-neutral-900 text-white p-4 rounded-xl border-2 border-neutral-600 mx-auto">
      {/* Top Section */}
      <div className="flex items-center justify-between bg-gray-800 rounded-md p-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="bg-transparent text-white text-lg w-3/4 focus:outline-none"
        />
        <button className="bg-gray-700 text-white px-3 py-1 rounded-md flex items-center">
          {tokenLogoUrl && (
            <img
              src={tokenLogoUrl}
              alt={`${tokenSymbol} logo`
              }
              className="w-5 h-5 mr-2 rounded-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/file.svg';
                (e.target as HTMLImageElement).alt = 'Default Logo';
              }}
            />
          )}
          {tokenSymbol}
        </button>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mb-2">
        <span className="text-white text-xl">↕</span> {/* Using ↕ for up-down arrow */}
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between bg-gray-800 rounded-md p-2">
        <span className="text-white text-lg">{loading ? 'Loading...' : outputValue}</span>
        <select
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          className="bg-green-600 text-white px-3 py-1 rounded-md appearance-none focus:outline-none"
        >
          <option value="USD">USD</option>
          {showNativeCurrency && (
            <option value="WBNB">{nativeCurrency}</option>
          )}
        </select>
      </div>
    </div>
  );
};

export default CurrencyConverter;