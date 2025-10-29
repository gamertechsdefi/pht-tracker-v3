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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
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
}

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
type DataSource = "coingecko" | "cryptocompare" | null;

>>>>>>> Stashed changes
=======
type DataSource = "coingecko" | "cryptocompare" | null;

>>>>>>> Stashed changes
function getPlatformId(chain: SupportedChain): string {
  return chain === "bsc" ? "binance-smart-chain" : "solana";
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
export default function PriceActionChart({ chain, contractAddress }: PriceActionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const [data, setData] = useState<{ prices: number[]; labels: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(1);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
  const [dataSource, setDataSource] = useState<DataSource>(null);
>>>>>>> Stashed changes
=======
  const [dataSource, setDataSource] = useState<DataSource>(null);
>>>>>>> Stashed changes

  const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${getPlatformId(chain)}/contract/${encodeURIComponent(
    contractAddress
  )}/market_chart?vs_currency=usd&days=${selectedTimeframe}`;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // Fetch data
=======
=======
>>>>>>> Stashed changes
  // Fetch from CryptoCompare as fallback
  async function fetchFromCryptoCompare(): Promise<{ prices: number[]; labels: string[] }> {
    const symbol = getSymbolFromChain(chain);
    const endpoint = getHistoEndpoint(selectedTimeframe);
    const limit = getHistoLimit(selectedTimeframe);
    
    const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}`;
    
    console.log('Fetching from CryptoCompare:', url);
    
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`CryptoCompare API failed: ${resp.status}`);
    }
    
    const json = (await resp.json()) as CryptoCompareResponse;
    
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

  // Fetch from CoinGecko first, fallback to CryptoCompare
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

  // Fetch data with fallback logic
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        console.log('Fetching data from:', coingeckoUrl);
        
        const resp = await fetch(coingeckoUrl, { cache: "no-store" });
        if (!resp.ok) {
          throw new Error(`Failed to fetch: ${resp.status}`);
        }
        
        const json = (await resp.json()) as MarketChartResponse;
        console.log('API Response:', json);
        
        if (!json.prices || json.prices.length === 0) {
          throw new Error('No price data received');
        }
        
        const prices: number[] = [];
        const labels: string[] = [];
        
        json.prices.forEach(([timestamp, price]) => {
          prices.push(price);
          
          // Format timestamp based on timeframe
          const date = new Date(timestamp);
          let timeLabel: string;
          
          if (selectedTimeframe <= 1) {
            // For 1D, show hours
            timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (selectedTimeframe <= 7) {
            // For 7D, show days
            timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          } else {
            // For 30D/90D, show dates
            timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          
          labels.push(timeLabel);
        });
        
        console.log('Extracted data:', { prices: prices.slice(0, 5), labels: labels.slice(0, 5) });
        setData({ prices, labels });
      } catch (e) {
        console.error('Error loading data:', e);
        setError(e instanceof Error ? e.message : "Unknown error");
=======
=======
>>>>>>> Stashed changes
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
          
          // Fallback to CryptoCompare
          const cryptoCompareData = await fetchFromCryptoCompare();
          console.log('CryptoCompare data loaded:', cryptoCompareData.prices.length, 'points');
          setData(cryptoCompareData);
          setDataSource("cryptocompare");
        }
      } catch (e) {
        console.error('All data sources failed:', e);
        setError(e instanceof Error ? e.message : "Failed to fetch price data from all sources");
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      } finally {
        setLoading(false);
      }
    }
    
    if (contractAddress) {
      loadData();
    }
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  }, [coingeckoUrl, contractAddress]);
=======
  }, [coingeckoUrl, contractAddress, selectedTimeframe]);
>>>>>>> Stashed changes
=======
  }, [coingeckoUrl, contractAddress, selectedTimeframe]);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toExponential(4)}`;
    }
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        <span className="text-xs text-gray-400">Source: CoinGecko</span>
=======
        <span className="text-xs text-gray-400">
          Source: {dataSource === "coingecko" ? "CoinGecko" : dataSource === "cryptocompare" ? "CryptoCompare" : "..."}
        </span>
>>>>>>> Stashed changes
=======
        <span className="text-xs text-gray-400">
          Source: {dataSource === "coingecko" ? "CoinGecko" : dataSource === "cryptocompare" ? "CryptoCompare" : "..."}
        </span>
>>>>>>> Stashed changes
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

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-2">
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          Debug: Chart Ready: {isChartReady ? 'Yes' : 'No'}, Data: {data ? `${data.prices.length} points` : 'None'}, Loading: {loading ? 'Yes' : 'No'}
=======
          Debug: Chart Ready: {isChartReady ? 'Yes' : 'No'}, Data: {data ? `${data.prices.length} points` : 'None'}, Loading: {loading ? 'Yes' : 'No'}, Source: {dataSource || 'None'}
>>>>>>> Stashed changes
=======
          Debug: Chart Ready: {isChartReady ? 'Yes' : 'No'}, Data: {data ? `${data.prices.length} points` : 'None'}, Loading: {loading ? 'Yes' : 'No'}, Source: {dataSource || 'None'}
>>>>>>> Stashed changes
        </div>
      )}

      {/* Chart or status */}
      {loading ? (
        <div className="text-center text-sm text-gray-400 py-8">Loading price data…</div>
      ) : error ? (
        <div className="text-center text-sm text-red-500 py-8">{error}</div>
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