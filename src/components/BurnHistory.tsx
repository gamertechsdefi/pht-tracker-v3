"use client";

import { useState, useEffect } from "react";

interface BurnTransaction {
  timestamp?: string;
  from?: string;
  amount?: number;
}

interface BurnsDisplayProps {
  tokenName: string;
  chain: string;
}

export default function BurnsDisplay({ tokenName }: BurnsDisplayProps) {
  const [burns, setBurns] = useState<BurnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!tokenName) return;

    const fetchBurns = async (attempt: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching burns for token: ${tokenName}, Attempt: ${attempt}`);

        const response = await fetch(`/api/bsc/burn-history/${encodeURIComponent(tokenName)}`);
        console.log("Response Status:", response.status);

        if (!response.ok) {
          const errorData: { message?: string } = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.message || "Failed to fetch burn transactions");
        }

        const data: { latestBurnTransactions: BurnTransaction[] } = await response.json();
        console.log("Burn Transactions Data:", data);

        setBurns(data.latestBurnTransactions);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error(`Fetch Error (Attempt ${attempt}):`, (err as Error).message);

        if (attempt < MAX_RETRIES) {
          // Retry with exponential backoff
          const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
          console.log(`Retrying in ${delay / 1000} seconds...`);
          setTimeout(() => fetchBurns(attempt + 1), delay);
        } else {
          setError((err as Error).message);
          setIsLoading(false);
        }
      }
    };

    fetchBurns();
  }, [tokenName]);

  const truncateAddress = (address?: string): string => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (isLoading) return <div className="text-center">Loading burns...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="md:py-0 py-8">
      <h2 className="text-2xl font-bold mb-2">Recent Burns</h2>

      <div className="hidden md:flex md:flex-row justify-center gap-32 h-96 overflow-y-auto rounded">
        <ul>
          <li className="flex justify-between py-2 font-semibold border-b gap-32">
            <span className="text-sm">Time</span>
            <span className="text-sm">Address</span>
            <span className="text-sm text-right pr-2">Amount</span>
          </li>

          {burns.map((burn, index) => (
            <li key={index} className="flex justify-between gap-32 py-2 border-b">
              <span className="text-sm">{burn.timestamp || "N/A"}</span>
              <span className="text-sm">{truncateAddress(burn.from)}</span>
              <span className="text-sm pr-2 text-right">
                {burn.amount?.toFixed(2) || "N/A"} {tokenName.toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:hidden h-96 overflow-y-auto rounded">
        <ul>
          {burns.map((burn, index) => (
            <li key={index} className="flex flex-col py-2 border-b">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Time:</span>
                <span className="text-sm">{burn.timestamp || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Address:</span>
                <span className="text-sm">{truncateAddress(burn.from)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Amount:</span>
                <span className="text-sm text-right">
                  {burn.amount?.toFixed(2) || "N/A"} {tokenName.toUpperCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}