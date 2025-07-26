"use client";
import { useEffect, useState } from "react";

const INTERVALS = [
  { key: "burn5min", label: "5 Minutes" },
  { key: "burn15min", label: "15 Minutes" },
  { key: "burn30min", label: "30 Minutes" },
  { key: "burn1h", label: "1 Hour" },
  { key: "burn3h", label: "3 Hours" },
  { key: "burn6h", label: "6 Hours" },
  { key: "burn12h", label: "12 Hours" },
  { key: "burn24h", label: "24 Hours" },
] as const;
type IntervalKey = typeof INTERVALS[number]['key'];

interface BurnIntervalsProps {
  tokenName: string;
}

interface BurnData {
  burn5min: number;
  burn15min: number;
  burn30min: number;
  burn1h: number;
  burn3h: number;
  burn6h: number;
  burn12h: number;
  burn24h: number;
  lastUpdated: string;
}

function formatBurnValue(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  if (Math.abs(value) < 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BurnIntervals({ tokenName }: BurnIntervalsProps) {
  const [data, setData] = useState<BurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<IntervalKey>("burn24h");

  useEffect(() => {
    if (!tokenName) return;
    let isMounted = true;

    const fetchData = () => {
      setLoading(true);
      setError(null);

      fetch(`/api/bsc/total-burnt/${encodeURIComponent(tokenName)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch burn intervals");
          return res.json();
        })
        .then((json) => {
          if (isMounted) {
            setData(json);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60000); // 60 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [tokenName]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInterval(e.target.value as IntervalKey);
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2 mx-auto"></div>
        <div className="text-center">Loading burn intervals...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!data) return null;

  const value = data[selectedInterval];

  return (
    <div className="bg-neutral-900 border-2 border-neutral-600 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-2">{tokenName.toUpperCase()} Burn Interval</h2>
      <div className="flex flex-col items-start gap-4 mb-2">
        <select
          value={selectedInterval}
          onChange={handleChange}
          className="bg-neutral-800 text-white border border-neutral-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {INTERVALS.map((interval) => (
            <option key={interval.key} value={interval.key}>
              {interval.label}
            </option>
          ))}
        </select>
        <span className="text-3xl font-bold text-red-500">
          {typeof value === 'number' ? formatBurnValue(value) : "N/A"}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
} 