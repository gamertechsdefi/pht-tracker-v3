// components/Converter.tsx

import React, { useState, useEffect } from 'react';

interface CurrencyConverterProps {
  tokenSymbol: string;
  tokenAddress: string;
  tokenLogoUrl?: string;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  tokenSymbol,
  tokenAddress,
  tokenLogoUrl
}) => {
  const [inputValue, setInputValue] = useState('1');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [outputValue, setOutputValue] = useState('0.000000000');
  const [rates, setRates] = useState<{ usd: number; bnb: number }>({ usd: 0, bnb: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        console.log('Fetching rates for token:', tokenAddress);
        // Using the correct CoinGecko API endpoint for BNB Smart Chain tokens
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/binance-smart-chain?contract_addresses=${tokenAddress}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) {
          console.error('API Error:', await response.text());
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Get BNB price in USD for conversion
        const bnbResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
        );
        const bnbData = await bnbResponse.json();
        const bnbPriceInUsd = bnbData.binancecoin?.usd || 0;
        
        // Parse the response to get token price in USD
        const tokenData = data[tokenAddress.toLowerCase()];
        const usdRate = tokenData?.usd || 0;
        
        // Calculate BNB rate based on USD price and BNB/USD rate
        const bnbRate = bnbPriceInUsd > 0 ? usdRate / bnbPriceInUsd : 0;
        
        console.log('Parsed rates - USD:', usdRate, 'BNB:', bnbRate);
        
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
  }, [tokenAddress]);

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
              alt={`${tokenSymbol} logo`}
              className="w-5 h-5 mr-2 rounded-full"
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
          <option value="WBNB">WBNB</option>
        </select>
      </div>
    </div>
  );
};

export default CurrencyConverter;