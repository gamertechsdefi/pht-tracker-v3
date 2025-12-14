"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode, ISeriesApi, Time, AreaSeries } from 'lightweight-charts';

type SupportedChain = "bsc" | "sol" | "rwa";

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
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const cacheRef = useRef<Map<string, { data: { time: Time; value: number }[]; ts: number }>>(new Map());
  const [data, setData] = useState<{ time: Time; value: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(1);

  // Get CryptoCompare API key from environment variable
  const cryptocompareApiKey = process.env.CRYPTOCOMPARE_API_KEY || "a2908b51095ddf69552f5dd2caabe3f9a12d2507f8ed32987008c936c1caff61";

  const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${getPlatformId(chain)}/contract/${encodeURIComponent(
    contractAddress
  )}/market_chart?vs_currency=usd&days=${selectedTimeframe}`;

  // Fetch data with fallback logic, retries, and abort handling
  useEffect(() => {
    // Fetch from internal RWA price-data route (proxies to external AssetChain API)
    // Map selectedTimeframe -> selector: D=24h, W=weekly, Y=90d
    async function fetchFromRWA(signal: AbortSignal): Promise<{ time: Time; value: number }[]> {
      const selector = selectedTimeframe <= 1 ? 'D' : selectedTimeframe <= 7 ? 'W' : 'Y';
      const url = `/api/rwa/price-data/${encodeURIComponent(contractAddress)}?selector=${encodeURIComponent(selector)}`;
      console.log('Fetching from RWA internal API:', url);

      const resp = await fetch(url, { signal });
      if (!resp.ok) {
        throw new Error(`RWA price API failed: ${resp.status}`);
      }

      const json = await resp.json();

      // Helper to coerce different time formats into milliseconds since epoch
      function toMs(value: any): number | null {
        if (value == null) return null;
        // number already
        if (typeof value === 'number' && !Number.isNaN(value)) {
          // heuristics: > 1e12 -> ms, > 1e9 -> seconds
          if (value > 1e12) return value;
          if (value > 1e9) return value * 1000;
          // small numbers unlikely, return as-is
          return value;
        }
        // numeric string
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (/^\d+$/.test(trimmed)) {
            const n = Number(trimmed);
            if (trimmed.length >= 13) return n;
            if (trimmed.length === 10) return n * 1000;
            if (n > 1e12) return n;
            if (n > 1e9) return n * 1000;
            return n;
          }
          // try parsing ISO date string
          const parsed = Date.parse(trimmed);
          if (!Number.isNaN(parsed)) return parsed;
        }
        return null;
      }

      const mapData = (arr: any[]) => {
        const result: { time: Time; value: number }[] = [];
        arr.forEach((item: any) => {
          let ms: number | null = null;
          let price: number = 0;

          if (Array.isArray(item)) {
            // [timestamp, price]
            ms = toMs(item[0]);
            price = Number(item[1]);
          } else {
            // { time/timestamp, close/price }
            ms = toMs(item.time ?? item.timestamp);
            price = Number(item.close ?? item.price ?? 0);
          }

          if (ms !== null && !Number.isNaN(price)) {
            result.push({
              time: (ms / 1000) as Time, // lightweight-charts uses seconds for timestamps
              value: price
            });
          }
        });
        // Sort by time just in case
        return result.sort((a, b) => (a.time as number) - (b.time as number));
      };

      // Try to normalize several common shapes
      if (Array.isArray(json.prices) && json.prices.length > 0) {
        return mapData(json.prices);
      }
      if (Array.isArray(json.data) && json.data.length > 0) {
        return mapData(json.data);
      }
      if (Array.isArray(json) && json.length > 0) {
        return mapData(json);
      }

      // Otherwise, can't parse
      throw new Error('Unrecognized RWA price data format');
    }
    // Fetch from CoinGecko
    async function fetchFromCoinGecko(signal: AbortSignal): Promise<{ time: Time; value: number }[]> {
      console.log('Fetching from CoinGecko:', coingeckoUrl);

      // Retry with simple backoff for 429/5xx
      const maxAttempts = 3;
      let lastErr: any = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const resp = await fetch(coingeckoUrl, { cache: 'no-store', signal });
          if (!resp.ok) {
            if ([429, 500, 502, 503, 504].includes(resp.status) && attempt < maxAttempts) {
              const delay = 300 * attempt;
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            throw new Error(`CoinGecko API failed: ${resp.status}`);
          }
          const json = (await resp.json()) as MarketChartResponse;
          if (!json.prices || json.prices.length === 0) {
            throw new Error('No price data from CoinGecko');
          }

          const chartData = json.prices.map(([timestamp, price]) => ({
            time: (timestamp / 1000) as Time,
            value: price
          }));
          return chartData;

        } catch (err: any) {
          if (signal.aborted) throw err;
          lastErr = err;
          if (attempt === maxAttempts) throw err;
        }
      }
      throw lastErr || new Error('CoinGecko failed');
    }

    // Fetch from CryptoCompare as fallback
    async function fetchFromCryptoCompare(signal: AbortSignal): Promise<{ time: Time; value: number }[]> {
      const symbol = getSymbolFromChain(chain);
      const endpoint = getHistoEndpoint(selectedTimeframe);
      const limit = getHistoLimit(selectedTimeframe);

      // Build URL with API key if provided
      let url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}`;

      if (cryptocompareApiKey) {
        url += `&api_key=${cryptocompareApiKey}`;
      }

      console.log('Fetching from CryptoCompare:', url.replace(cryptocompareApiKey || '', '***'));
      // Retry with backoff for 429/5xx
      const maxAttempts = 2;
      let resp: Response | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          resp = await fetch(url, { signal });
          if (!resp.ok) {
            if ([429, 500, 502, 503, 504].includes(resp.status) && attempt < maxAttempts) {
              const delay = 300 * attempt;
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            throw new Error(`CryptoCompare API failed: ${resp.status}`);
          }
          break;
        } catch (err) {
          if (signal.aborted) throw err;
          if (attempt === maxAttempts) throw err;
        }
      }
      if (!resp) throw new Error('CryptoCompare: no response');
      const json = (await resp.json()) as CryptoCompareResponse;

      // Check for API error response
      if (json.Response === 'Error') {
        throw new Error(json.Message || 'CryptoCompare API error');
      }

      if (!json.Data?.Data || json.Data.Data.length === 0) {
        throw new Error('No data from CryptoCompare');
      }

      return json.Data.Data.map((dataPoint) => ({
        time: dataPoint.time as Time,
        value: dataPoint.close
      }));
    }

    const abortController = new AbortController();
    const { signal } = abortController;
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const key = `${chain}:${contractAddress}:${selectedTimeframe}`;
        // Serve stale cache immediately if present
        const cached = cacheRef.current.get(key);
        if (cached && !cancelled) {
          setData(cached.data);
        }

        // If this is an RWA token, use internal RWA price-data route first
        if (chain === 'rwa') {
          try {
            const rwaData = await fetchFromRWA(signal);
            console.log('RWA data loaded:', rwaData.length, 'points');
            setData(rwaData);
            cacheRef.current.set(key, { data: rwaData, ts: Date.now() });
            return;
          } catch (rwaErr) {
            console.warn('RWA data failed, falling back to other providers:', rwaErr);
            // fallthrough to other providers
          }
        }

        // Try CoinGecko first
        try {
          const coinGeckoData = await fetchFromCoinGecko(signal);
          console.log('CoinGecko data loaded:', coinGeckoData.length, 'points');
          setData(coinGeckoData);
          cacheRef.current.set(key, { data: coinGeckoData, ts: Date.now() });
          return;
        } catch (cgError) {
          console.warn('CoinGecko failed, trying CryptoCompare:', cgError);

          // Fallback to CryptoCompare if API key is provided
          if (!cryptocompareApiKey) {
            throw new Error('CoinGecko failed and no CryptoCompare API key provided. Get a free key at https://www.cryptocompare.com/cryptopian/api-keys');
          }

          const cryptoCompareData = await fetchFromCryptoCompare(signal);
          console.log('CryptoCompare data loaded:', cryptoCompareData.length, 'points');
          setData(cryptoCompareData);
          cacheRef.current.set(key, { data: cryptoCompareData, ts: Date.now() });
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
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [coingeckoUrl, contractAddress, selectedTimeframe, chain, cryptocompareApiKey]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time, tickMarkType: any, locale: string) => {
          // 'time' is a UNIX timestamp (seconds) or a business day object
          // Convert to milliseconds
          const date = new Date((time as number) * 1000);

          if (selectedTimeframe <= 1) {
            // Intraday (1D): Show HH:mm
            return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
          } else if (selectedTimeframe <= 7) {
            // 1 Week: Show Day + Time if space permits, or just Day
            // lightweight-charts handles density, but let's give a short date format
            return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
          } else if (selectedTimeframe <= 365) {
            // Months/Year: Month Day
            return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
          } else {
            // > 1 Year: Month Year
            return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
          }
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      localization: {
        locale: 'en-US',
      },
    });

    // Calculate dynamic precision based on the last price
    let precision = 2;
    let minMove = 0.01;

    if (data && data.length > 0) {
      const lastPrice = data[data.length - 1].value;
      if (lastPrice > 0 && lastPrice < 1) {
        // Calculate number of leading zeros
        const zeros = -Math.floor(Math.log10(lastPrice));
        // We want ~4 significant figures, but at least 2 decimals
        // e.g. 0.001234 (2 zeros) -> want ~6 decimals?
        // Let's use a heuristic: zeros + 4, capped at 10
        precision = Math.min(zeros + 4, 10);
        minMove = Number(`1e-${precision}`);
      }
    }

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#f97316',
      topColor: 'rgba(249, 115, 22, 0.4)',
      bottomColor: 'rgba(249, 115, 22, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: precision,
        minMove: minMove,
      },
    });

    // Handle duplicates or unsorted data just in case
    const uniqueData = Array.from(new Map(data.map(item => [item.time, item])).values())
      .sort((a, b) => (a.time as number) - (b.time as number));

    series.setData(uniqueData);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, selectedTimeframe]);

  return (
    <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price Action</h3>
      </div>

      {/* Timeframe selector */}
      <div className="flex items-center gap-2 mb-4">
        {TIMEFRAMES.map((timeframe) => (
          <button
            key={timeframe.days}
            onClick={() => setSelectedTimeframe(timeframe.days)}
            className={`px-3 py-1 text-xs rounded ${selectedTimeframe === timeframe.days
              ? "bg-orange-500 text-white"
              : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"
              }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>

      {/* Chart or status */}
      {loading && !data ? (
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
      ) : data && data.length > 0 ? (
        <div className="h-64 md:h-80 w-full" ref={chartContainerRef} style={{ position: 'relative' }} />
      ) : (
        <div className="text-center text-sm text-gray-400 py-8">No price data available.</div>
      )}
    </div>
  );
}