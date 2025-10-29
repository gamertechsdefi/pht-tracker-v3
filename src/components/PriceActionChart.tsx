"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type SupportedChain = "bsc" | "sol";

interface PriceActionChartProps {
  chain: SupportedChain;
  contractAddress: string;
}

interface MarketChartResponse {
  prices: [number, number][]; // [timestamp(ms), price]
  total_volumes: [number, number][]; // [timestamp(ms), volume]
  market_caps: [number, number][]; // [timestamp(ms), market_cap]
}

interface CryptoCompareResponse {
  Data: {
    Data: Array<{
      time: number; // timestamp in seconds
      close: number; // price
      high: number;
      low: number;
      open: number;
      volumefrom: number;
      volumeto: number;
    }>;
  };
  Response?: string;
  Message?: string;
}

const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

type DataSource = "coingecko" | "cryptocompare" | null;

function getPlatformId(chain: SupportedChain): string {
  return chain === "bsc" ? "binance-smart-chain" : "solana";
}

function getSymbolFromChain(chain: SupportedChain): string {
  // This is a simplified approach - in production you'd want to map contract addresses to symbols
  return chain === "bsc" ? "BNB" : "SOL";
}

function getHistoEndpoint(days: number): string {
  if (days <= 1) return "histominute";
  if (days <= 7) return "histohour";
  return "histoday";
}

function getHistoLimit(days: number): number {
  if (days <= 1) return 1440; // 24 hours * 60 minutes
  if (days <= 7) return 168; // 7 days * 24 hours
  if (days <= 30) return 30;
  return 90;
}

export default function PriceActionChart({ 
  chain, 
  contractAddress
}: PriceActionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const [data, setData] = useState<{ prices: number[]; labels: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(1);
  const [dataSource, setDataSource] = useState<DataSource>(null);

  // Get CryptoCompare API key from environment variable
  const cryptocompareApiKey = process.env.CRYPTOCOMPARE_API_KEY || "a2908b51095ddf69552f5dd2caabe3f9a12d2507f8ed32987008c936c1caff61";

  const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${getPlatformId(chain)}/contract/${encodeURIComponent(
    contractAddress
  )}/market_chart?vs_currency=usd&days=${selectedTimeframe}`;

  // Fetch data with fallback logic
  useEffect(() => {
    // Fetch from CoinGecko
    async function fetchFromCoinGecko(): Promise<{ prices: number[]; labels: string[] }> {
      console.log('Fetching from CoinGecko:', coingeckoUrl);
      
      const resp = await fetch(coingeckoUrl, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`CoinGecko API failed: ${resp.status}`);
      }
      
      const json = (await resp.json()) as MarketChartResponse;
      
      if (!json.prices || json.prices.length === 0) {
        throw new Error('No price data from CoinGecko');
      }
      
      const prices: number[] = [];
      const labels: string[] = [];
      
      json.prices.forEach(([timestamp, price]) => {
        prices.push(price);
        
        const date = new Date(timestamp);
        let timeLabel: string;
        
        if (selectedTimeframe <= 1) {
          timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (selectedTimeframe <= 7) {
          timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
          timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        
        labels.push(timeLabel);
      });
      
      return { prices, labels };
    }

    // Fetch from CryptoCompare as fallback
    async function fetchFromCryptoCompare(): Promise<{ prices: number[]; labels: string[] }> {
      const symbol = getSymbolFromChain(chain);
      const endpoint = getHistoEndpoint(selectedTimeframe);
      const limit = getHistoLimit(selectedTimeframe);
      
      // Build URL with API key if provided
      let url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}`;
      
      if (cryptocompareApiKey) {
        url += `&api_key=${cryptocompareApiKey}`;
      }
      
      console.log('Fetching from CryptoCompare:', url.replace(cryptocompareApiKey || '', '***'));
      
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`CryptoCompare API failed: ${resp.status}`);
      }
      
      const json = (await resp.json()) as CryptoCompareResponse;
      
      // Check for API error response
      if (json.Response === 'Error') {
        throw new Error(json.Message || 'CryptoCompare API error');
      }
      
      if (!json.Data?.Data || json.Data.Data.length === 0) {
        throw new Error('No data from CryptoCompare');
      }
      
      const prices: number[] = [];
      const labels: string[] = [];
      
      json.Data.Data.forEach((dataPoint) => {
        prices.push(dataPoint.close);
        
        const date = new Date(dataPoint.time * 1000); // Convert seconds to milliseconds
        let timeLabel: string;
        
        if (selectedTimeframe <= 1) {
          timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (selectedTimeframe <= 7) {
          timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
          timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        
        labels.push(timeLabel);
      });
      
      return { prices, labels };
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setDataSource(null);
        
        // Try CoinGecko first
        try {
          const coinGeckoData = await fetchFromCoinGecko();
          console.log('CoinGecko data loaded:', coinGeckoData.prices.length, 'points');
          setData(coinGeckoData);
          setDataSource("coingecko");
          return;
        } catch (cgError) {
          console.warn('CoinGecko failed, trying CryptoCompare:', cgError);
          
          // Fallback to CryptoCompare if API key is provided
          if (!cryptocompareApiKey) {
            throw new Error('CoinGecko failed and no CryptoCompare API key provided. Get a free key at https://www.cryptocompare.com/cryptopian/api-keys');
          }
          
          const cryptoCompareData = await fetchFromCryptoCompare();
          console.log('CryptoCompare data loaded:', cryptoCompareData.prices.length, 'points');
          setData(cryptoCompareData);
          setDataSource("cryptocompare");
        }
      } catch (e) {
        console.error('All data sources failed:', e);
        setError(e instanceof Error ? e.message : "Failed to fetch price data from all sources");
      } finally {
        setLoading(false);
      }
    }
    
    if (contractAddress) {
      loadData();
    }
  }, [coingeckoUrl, contractAddress, selectedTimeframe, chain, cryptocompareApiKey]);

  // Create chart
  useEffect(() => {
    if (!isChartReady || !data || !canvasRef.current) {
      console.log('Chart not ready:', { isChartReady, hasData: !!data, hasCanvas: !!canvasRef.current });
      return;
    }

    console.log('Creating chart with', data.prices.length, 'data points');
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      console.log('No canvas context');
      return;
    }

    // @ts-ignore
    const Chart = (window as any).Chart;
    if (!Chart) {
      console.log('Chart.js not available');
      return;
    }

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    try {
      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: "Price",
              data: data.prices,
              borderColor: "#f97316",
              backgroundColor: "rgba(249, 115, 22, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              ticks: {
                maxTicksLimit: 8,
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(255,255,255,0.06)",
              },
            },
            y: {
              display: true,
              ticks: {
                callback: (val: any) => `$${Number(val).toFixed(6)}`,
                color: "#9ca3af",
              },
              grid: {
                color: "rgba(255,255,255,0.06)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const value = ctx.parsed.y;
                  return `Price: $${Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
                },
              },
            },
          },
        },
      });
      
      console.log('Chart created successfully');
    } catch (chartError) {
      console.error('Chart creation failed:', chartError);
      setError('Failed to create chart');
    }
  }, [isChartReady, data]);

  return (
    <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-md p-4">
      {/* Load Chart.js */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Chart.js loaded');
          setIsChartReady(true);
        }}
        onError={(e) => {
          console.error('Chart.js failed to load:', e);
          setError('Failed to load chart library');
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price Action</h3>
        <span className="text-xs text-gray-400">
          Source: {dataSource === "coingecko" ? "CoinGecko" : dataSource === "cryptocompare" ? "CryptoCompare" : "..."}
        </span>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-2 mb-4">
        {TIMEFRAMES.map((timeframe) => (
          <button
            key={timeframe.days}
            onClick={() => setSelectedTimeframe(timeframe.days)}
            className={`px-3 py-1 text-xs rounded ${
              selectedTimeframe === timeframe.days
                ? "bg-orange-500 text-white"
                : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"
            }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>

      {/* Chart or status */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">Loading price data…</div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-sm text-red-500 mb-2">{error}</div>
          {!cryptocompareApiKey && error.includes('CryptoCompare') && (
            <a 
              href="https://www.cryptocompare.com/cryptopian/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              Get a free CryptoCompare API key →
            </a>
          )}
        </div>
      ) : data && data.prices.length > 0 ? (
        <div className="h-64 md:h-80">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400 py-8">No price data available.</div>
      )}
    </div>
  );
}