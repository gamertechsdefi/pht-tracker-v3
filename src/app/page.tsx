'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
// import { getTokenBySymbol } from '@/lib/tokenRegistry';

interface Token {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  price: string | number;
  marketCap: string | number;
}

function formatMarketCap(marketCap: number | string): string {
  if (typeof marketCap === 'string') {
    marketCap = parseFloat(marketCap.replace(/[^0-9.-]+/g, ''));
  }

  if (isNaN(marketCap)) {
    return 'N/A';
  }

  if (marketCap >= 1e12) {
    return (marketCap / 1e12).toFixed(2) + 'T';
  }
  if (marketCap >= 1e9) {
    return (marketCap / 1e9).toFixed(2) + 'B';
  }
  if (marketCap >= 1e6) {
    return (marketCap / 1e6).toFixed(2) + 'M';
  }
  if (marketCap >= 1e3) {
    return (marketCap / 1e3).toFixed(2) + 'K';
  }
  return marketCap.toString();
}

function formatPrice(price: number | string): { display: string; isExponential: boolean; zeros?: number; rest?: string } {
  // Handle N/A or invalid values
  if (price === 'N/A' || price === null || price === undefined || price === '') {
    return {
      display: 'N/A',
      isExponential: false,
    };
  }

  // Convert to number if it's a string
  let priceNum: number;
  if (typeof price === 'string') {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanedPrice = price.replace(/[^0-9.-]/g, '');
    priceNum = parseFloat(cleanedPrice);
  } else {
    priceNum = price;
  }

  // Check if conversion failed
  if (isNaN(priceNum)) {
    return {
      display: 'N/A',
      isExponential: false,
    };
  }

  const priceStr = priceNum.toString();

  // Check for very small numbers with many leading zeros
  if (priceStr.includes('.')) {
    const decimalPart = priceStr.split('.')[1];
    if (decimalPart && decimalPart.startsWith('00000')) {
      const leadingZeros = decimalPart.match(/^0+/)?.[0].length || 0;
      const restOfNumber = decimalPart.substring(leadingZeros).substring(0, 6); // Limit to 6 digits
      return {
        display: '$0.',
        isExponential: true,
        zeros: leadingZeros,
        rest: restOfNumber,
      };
    }
  }

  // For regular numbers, format with appropriate decimal places
  let formattedPrice: string;
  if (priceNum >= 1) {
    formattedPrice = priceNum.toFixed(2);
  } else if (priceNum >= 0.01) {
    formattedPrice = priceNum.toFixed(4);
  } else {
    formattedPrice = priceNum.toFixed(8);
  }

  return {
    display: '$' + formattedPrice,
    isExponential: false,
  };
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const data: Token[] = await response.json();

        const phtToken = data.find((token) => token.symbol.toLowerCase() === 'pht');
        const otherTokens = data.filter((token) => token.symbol.toLowerCase() !== 'pht');

        const sortedData = phtToken ? [phtToken, ...otherTokens] : data;

        setTokens(sortedData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  return (
    <div className="">
      <Header />
      <div className=" pt-8">
        <div className="shadow overflow-hidden">
          {/* Mobile: Horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="bg-orange-500">
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left sticky left-0 bg-orange-500 z-20 min-w-[120px]">
                    Token
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Price
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Marketcap
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="bg-[##440808] text-center py-10 text-white">
                      Loading tokens...
                    </td>
                  </tr>
                ) : (
                  tokens.map((token: Token) => (
                    <tr key={token.address} className="border-b border-orange-300 hover:bg-orange-400 transition-colors">
                      {/* Token column - sticky on mobile */}
                      <td className="px-5 py-4 text-sm sticky left-0 bg-[#440808] z-10 min-w-[120px]">
                        <Link href={`/${token.chain}/${token.address}`} className="flex items-center hover:opacity-80">
                          <img
                            src={`/images/${token.chain}/token-logos/${token.address.toLowerCase()}.png`}
                            alt={token.symbol}
                            width={24}
                            height={24}
                            className="mr-3 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Try API endpoint as fallback
                              if (!target.src.includes('/api/')) {
                                target.src = `/api/${token.chain}/logo/${token.address}`;
                              } else {
                                // Final fallback to default logo
                                target.src = '/logo.png';
                              }
                            }}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-white whitespace-nowrap font-medium">
                                {token.symbol.toUpperCase()}
                              </span>
                              <img
                                src={`/${token.chain}-logo.png`}
                                alt={token.chain}
                                width={16}
                                height={16}
                                className="flex-shrink-0 rounded-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-neutral-200 text-xs whitespace-nowrap">
                              {token.name}
                            </span>
                          </div>
                        </Link>
                      </td>
                      
                      {/* Price column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          {(() => {
                            const { display, isExponential, zeros, rest } = formatPrice(token.price);
                            if (display === 'N/A') {
                              return <span className="text-neutral-400">N/A</span>;
                            }
                            if (!isExponential) return display;
                            return (
                              <>
                                {display}0
                                <sub>{zeros}</sub>
                                {rest}
                              </>
                            );
                          })()}
                        </span>
                      </td>
                      
                      {/* Market Cap column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          {formatMarketCap(token.marketCap)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Optional: Scroll indicator for mobile */}
          <div className="md:hidden bg-neutral-800 px-4 py-2 text-xs text-neutral-400 text-center">
            ← Swipe to see more columns →
          </div>
        </div>
      </div>
    </div>
  );
}