'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";

function formatMarketCap(marketCap: number | string): string {
  if (typeof marketCap === 'string') {
    marketCap = parseFloat(marketCap.replace(/[^0-9.-]+/g,""));
  }

  if (isNaN(marketCap)) {
    return "N/A";
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

function formatPrice(price: number | string): { display: string; isExponential: boolean; zeros?: number, rest?: string } {
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
        rest: restOfNumber
      };
    }
  }

  return {
    display: priceStr,
    isExponential: false,
  };
}

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const data = await response.json();
        setTokens(data);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  return (
    <div className="container mx-auto">
      <div className="">
        <div className="shadow rounded-lg">
          {/* Header */}
          <div className="grid grid-cols-12 bg-orange-500 text-start text-md items-center font-semibold text-white uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-4 px-5 py-3">Token</div>
            <div className="col-span-8 px-5 py-3">
              <div className="grid grid-cols-2 items-center">
                <div>Price</div>
                <div className="whitespace-no-wrap">Market Cap</div>
              </div>
            </div>
          </div>
          {/* Body */}
          <div>
            {loading ? (
              <div className="text-center p-10">Loading tokens...</div>
            ) : (
              tokens.map((token: any) => (
                <div key={token.symbol} className="bg-neutral-700 grid grid-cols-12">
                  <div className="bg-neutral-900 col-span-4 px-5 py-5 text-sm">
                    <Link href={`/bsc/${token.symbol}`} className="flex items-center">
                      <img 
                        src={`/api/bsc/logo/${token.symbol}`} 
                        alt={token.symbol} 
                        width={24} 
                        height={24} 
                        className="mr-3" 
                        onError={(e) => {
                          (e.target as any).src = '/logo.png';
                        }}
                      />
                      <p className="text-white whitespace-no-wrap">{token.symbol.toUpperCase()}</p>
                    </Link>
                  </div>
                  <div className="col-span-8 overflow-x-auto text-sm">
                    <div className="grid grid-cols-2">
                      <div className="px-5 py-5">
                        <p className="text-white whitespace-no-wrap">
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
                      <div className="px-5 py-5">
                        <p className="text-white whitespace-no-wrap">{formatMarketCap(token.marketCap)}</p>
                      </div>
                    </div>
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