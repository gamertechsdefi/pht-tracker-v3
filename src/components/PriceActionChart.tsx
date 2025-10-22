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

const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

function getPlatformId(chain: SupportedChain): string {
  return chain === "bsc" ? "binance-smart-chain" : "solana";
}

export default function PriceActionChart({ chain, contractAddress }: PriceActionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);
  const [data, setData] = useState<{ prices: number[]; labels: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(1);

  const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${getPlatformId(chain)}/contract/${encodeURIComponent(
    contractAddress
  )}/market_chart?vs_currency=usd&days=${selectedTimeframe}`;

  // Fetch data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
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
      } finally {
        setLoading(false);
      }
    }
    
    if (contractAddress) {
      loadData();
    }
  }, [coingeckoUrl, contractAddress]);

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

  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toExponential(4)}`;
    }
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

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
        <span className="text-xs text-gray-400">Source: CoinGecko</span>
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
          Debug: Chart Ready: {isChartReady ? 'Yes' : 'No'}, Data: {data ? `${data.prices.length} points` : 'None'}, Loading: {loading ? 'Yes' : 'No'}
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