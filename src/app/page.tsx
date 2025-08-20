'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Token {
  symbol: string;
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
        <div className="shadow rounded-lg md:flex md:flex-row flex-col">
          {/* Fixed Token Column */}
          <div className="md:w-1/2 w-full">
            {/* Token Header */}
            <div className="bg-orange-500 text-md font-semibold text-white uppercase tracking-wider px-5 py-3 sticky top-0 z-10">
              Token
            </div>
            {/* Token Body */}
            {loading ? (
              <div className="bg-neutral-700 text-center py-10 min-h-[60px] flex items-center justify-center">
                Loading tokens...
              </div>
            ) : (
              tokens.map((token: Token) => (
                <div
                  key={token.symbol}
                  className="bg-neutral-900 px-5 py-5 text-sm border-b border-neutral-800 min-h-[60px] flex items-center"
                >
                  <Link href={`/bsc/${token.symbol}`} className="flex items-center">
                    <img
                      src={`/api/bsc/logo/${token.symbol}`}
                      alt={token.symbol}
                      width={24}
                      height={24}
                      className="mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <p className="text-white whitespace-nowrap">{token.symbol.toUpperCase()}</p>
                  </Link>
                </div>
              ))
            )}
          </div>
          {/* Scrollable Price and Market Cap Columns */}
          <div className="md:w-1/2 w-full overflow-x-auto">
            {/* Header */}
            <div className="bg-orange-500 text-md font-semibold text-white uppercase tracking-wider sticky top-0 z-10 flex min-w-[300px]">
              <div className="w-[150px] px-5 py-3">Price</div>
              <div className="w-[150px] px-5 py-3">Marketcap</div>
            </div>
            {/* Body */}
            {loading ? (
              <div className="bg-neutral-700 text-center py-10 min-h-[60px] flex items-center justify-center min-w-[300px]">
                Loading...
              </div>
            ) : (
              tokens.map((token: Token) => (
                <div
                  key={token.symbol}
                  className="flex border-b border-neutral-800 bg-neutral-900 min-h-[60px] min-w-[300px]"
                >
                  <div className="w-[150px] px-5 py-5 text-sm flex items-center">
                    <p className="text-white whitespace-nowrap">
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
                    </p>
                  </div>
                  <div className="w-[150px] px-5 py-5 text-sm flex items-center">
                    <p className="text-white whitespace-nowrap">{formatMarketCap(token.marketCap)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}