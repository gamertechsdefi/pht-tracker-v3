'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getTokenBySymbol } from '@/lib/tokenRegistry';

interface Token {
  symbol: string;
  name: string;
  address: string;
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
  const priceStr = String(price);

  if (priceStr.includes('.')) {
    const decimalPart = priceStr.split('.')[1];
    if (decimalPart.startsWith('00000')) {
      const leadingZeros = decimalPart.match(/^0+/)?.[0].length || 0;
      const restOfNumber = decimalPart.substring(leadingZeros);
      return {
        display: `0.`,
        isExponential: true,
        zeros: leadingZeros,
        rest: restOfNumber,
      };
    }
  }

  return {
    display: priceStr,
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
    <div className="container mx-auto">
      <Header />
      <div className="px-4 pt-8">
        <div className="shadow rounded-lg overflow-hidden">
          {/* Mobile: Horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] bg-neutral-900">
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
                    <td colSpan={3} className="bg-neutral-700 text-center py-10 text-white">
                      Loading tokens...
                    </td>
                  </tr>
                ) : (
                  tokens.map((token: Token) => (
                    <tr key={token.address} className="border-b border-neutral-800 hover:bg-neutral-800 transition-colors">
                      {/* Token column - sticky on mobile */}
                      <td className="px-5 py-4 text-sm sticky left-0 bg-neutral-900 z-10 min-w-[120px]">
                        <Link href={`/bsc/${token.address}`} className="flex items-center hover:opacity-80">
                          <img
                            src={`/api/bsc/logo/${token.address}`}
                            alt={token.symbol}
                            width={24}
                            height={24}
                            className="mr-3 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-white whitespace-nowrap font-medium">
                              {token.symbol.toUpperCase()}
                            </span>
                            <span className="text-gray-400 text-xs whitespace-nowrap">
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