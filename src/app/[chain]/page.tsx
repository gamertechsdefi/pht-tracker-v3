'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Token {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  price: string | number;
  marketCap: string | number;
  volume: string | number;
  change24h: string | number;
}

interface PageProps {
  params: Promise<{
    chain: string;
  }>;
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

export default function ChainPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const chain = resolvedParams.chain.toLowerCase();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all tokens
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const data: Token[] = await response.json();

        // Filter tokens by chain
        const filteredTokens = data.filter((token) => token.chain.toLowerCase() === chain);

        if (filteredTokens.length === 0) {
          setError(`No tokens found for chain: ${chain.toUpperCase()}`);
        }

        setTokens(filteredTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to load tokens. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [chain]);

  return (
    <div className="container mx-auto">
      <Header />
      <div className="px-4 pt-8">
        {/* Chain Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {chain.toUpperCase()} Tokens
          </h1>
          <p className="text-gray-400">
            Showing {tokens.length} token{tokens.length !== 1 ? 's' : ''} on {chain.toUpperCase()}
          </p>
        </div>

        <div className="shadow rounded-lg overflow-hidden">
          {/* Mobile: Horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] bg-neutral-900">
              <thead>
                <tr className="bg-orange-500">
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left sticky left-0 bg-orange-500 z-20 min-w-[150px]">
                    Token
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Price
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    Market Cap
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                    24h Volume
                  </th>
                  <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[100px]">
                    24h Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="bg-neutral-700 text-center py-10 text-white">
                      Loading {chain.toUpperCase()} tokens...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="bg-neutral-700 text-center py-10 text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : (
                  tokens.map((token: Token) => (
                    <tr key={token.address} className="border-b border-neutral-800 hover:bg-neutral-800 transition-colors">
                      {/* Token column - sticky on mobile */}
                      <td className="px-5 py-4 text-sm sticky left-0 bg-neutral-900 z-10 min-w-[150px]">
                        <Link href={`/${token.chain}/${token.address}`} className="flex items-center hover:opacity-80">
                          <img
                            src={`/images/${token.chain}/token-logos/${token.address.toLowerCase()}.png`}
                            alt={token.symbol}
                            width={32}
                            height={32}
                            className="mr-3 flex-shrink-0 rounded-full"
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
                            if (!isExponential) return `$${display}`;
                            return (
                              <>
                                ${display}0
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
                          ${formatMarketCap(token.marketCap)}
                        </span>
                      </td>

                      {/* Volume column */}
                      <td className="px-5 py-4 text-sm min-w-[120px]">
                        <span className="text-white whitespace-nowrap">
                          {token.volume === 'N/A' ? 'N/A' : `$${formatMarketCap(token.volume)}`}
                        </span>
                      </td>

                      {/* 24h Change column */}
                      <td className="px-5 py-4 text-sm min-w-[100px]">
                        {token.change24h === 'N/A' ? (
                          <span className="text-gray-400">N/A</span>
                        ) : (
                          <span className={`whitespace-nowrap ${
                            parseFloat(String(token.change24h)) >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {parseFloat(String(token.change24h)) >= 0 ? '+' : ''}
                            {parseFloat(String(token.change24h)).toFixed(2)}%
                          </span>
                        )}
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

        {/* Back to all tokens link */}
        {!loading && !error && (
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-orange-500 hover:text-orange-400 transition-colors duration-200 font-medium"
            >
              ← View all chains
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
