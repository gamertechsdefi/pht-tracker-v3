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
  volume: string | number;
  liquidity: string | number;
  change24h?: string | number;
}

function formatCompactNumber(value: number | string): string {
  if (typeof value === 'string') {
    value = parseFloat(value.replace(/[^0-9.-]+/g, ''));
  }

  if (isNaN(value) || value === 0) {
    return 'N/A';
  }

  if (value >= 1e12) {
    return (value / 1e12).toFixed(2) + 'T';
  }
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K';
  }
  return value.toFixed(2);
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
    <div className="container mx-auto">
      <Header />
      <div className="px-4 pt-8">
        {/* Mobile: Card Layout */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div
                  className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="text-white mt-4">Loading tokens...</p>
              </div>
            </div>
          ) : (
            tokens.map((token: Token) => {
              const { display, isExponential, zeros, rest } = formatPrice(token.price);
              const priceDisplay = display === 'N/A' ? (
                <span className="text-neutral-400">N/A</span>
              ) : isExponential ? (
                <>
                  {display}0<sub>{zeros}</sub>{rest}
                </>
              ) : (
                display
              );

              return (
                <Link
                  key={token.address}
                  href={`/${token.chain}/${token.address}`}
                  className="rounded-lg p-4 border border-orange-500/30 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Left: Token Icon and Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Token Icon with Chain Badge */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={`/api/${token.chain}/logo/${token.address}`}
                          alt={token.symbol}
                          width={48}
                          height={48}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                        {/* Chain Logo Overlay */}
                        <img
                          src={`/${token.chain}-logo.png`}
                          alt={token.chain}
                          width={20}
                          height={20}
                          className="absolute -bottom-1 -right-1 rounded-sm border-2 border-black"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Token Symbol and Name */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-white font-bold text-lg whitespace-nowrap truncate">
                          {token.symbol.toUpperCase()}
                        </span>
                        <span className="text-neutral-200 text-xs whitespace-nowrap truncate">
                          {token.name}
                        </span>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="flex flex-col text-right flex-shrink-0 ml-2">
                      <span className="text-white font-semibold text-xl whitespace-nowrap">
                        {priceDisplay}
                      </span>
                      {token.change24h !== 'N/A' && token.change24h !== undefined && (
                        (() => {
                          const change = parseFloat(String(token.change24h));
                          const isPositive = change >= 0;
                          return (
                            <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex gap-2">
                    {/* Volume */}
                    <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                      <div className="text-orange-500 text-xs font-medium">VOL</div>
                      <div className="text-white text-sm font-semibold">
                        ${formatCompactNumber(token.volume)}
                      </div>
                    </div>

                    {/* Liquidity */}
                    <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                      <div className="text-orange-500 text-xs font-medium">LIQ.</div>
                      <div className="text-white text-sm font-semibold">
                        ${formatCompactNumber(token.liquidity)}
                      </div>
                    </div>

                    {/* Market Cap */}
                    <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                      <div className="text-orange-500 text-xs font-medium">MCAP</div>
                      <div className="text-white text-sm font-semibold">
                        ${formatCompactNumber(token.marketCap)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-orange-500">
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left sticky left-0 bg-orange-500 z-20 min-w-[150px]">
                    Token
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Price
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    24H Change
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Market Cap
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Liquidity
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    24H Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-white">
                      Loading tokens...
                    </td>
                  </tr>
                ) : (
                  tokens.map((token: Token) => (
                    <tr key={token.address} className="border-b border-orange-500 hover:bg-orange-600 transition-colors">
                      {/* Token column - sticky on mobile */}
                      <td className="px-5 py-4 text-sm sticky left-0  z-10 min-w-[150px]">
                        <Link href={`/${token.chain}/${token.address}`} className="flex items-center hover:opacity-80">
                          {/* Token Icon with Chain Badge */}
                          <div className="relative flex-shrink-0 mr-3">
                            <img
                              src={`/api/${token.chain}/logo/${token.address}`}
                              alt={token.symbol}
                              width={32}
                              height={32}
                              className="rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.png';
                              }}
                            />
                            {/* Chain Logo Overlay */}
                            <img
                              src={`/${token.chain}-logo.png`}
                              alt={token.chain}
                              width={16}
                              height={16}
                              className="absolute -bottom-1 -right-1 rounded-sm border-2 border-black"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white whitespace-nowrap font-medium text-base">
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
                          {token.price === 'N/A' ? 'N/A' : (() => {
                            const { display, isExponential, zeros, rest } = formatPrice(token.price);
                            if (!isExponential) return display;
                            return (
                              <>
                                {display}0<sub>{zeros}</sub>{rest}
                              </>
                            );
                          })()}
                        </span>
                      </td>

                      {/* 24h Change column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        {token.change24h === 'N/A' || token.change24h === undefined ? (
                          <span className="text-white whitespace-nowrap">N/A</span>
                        ) : (
                          (() => {
                            const change = parseFloat(String(token.change24h));
                            const isPositive = change >= 0;
                            return (
                              <span className={`whitespace-nowrap font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                              </span>
                            );
                          })()
                        )}
                      </td>

                      {/* Market Cap column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          ${formatCompactNumber(token.marketCap)}
                        </span>
                      </td>

                      {/* Liquidity column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          {token.liquidity === 'N/A' ? 'N/A' : `$${formatCompactNumber(token.liquidity)}`}
                        </span>
                      </td>

                      {/* Volume column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          {token.volume === 'N/A' ? 'N/A' : `$${formatCompactNumber(token.volume)}`}
                        </span>
                      </td>


                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}