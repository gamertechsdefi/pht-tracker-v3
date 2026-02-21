"use client";

import { useEffect, useState } from "react";

interface VolumeData {
  volumeTotal: string;
  volumeBuys: string;
  volumeSells: string;
}

interface TxnsData {
  txns: string;
  txnsBuys?: string;
  txnsSells?: string;
}

interface VolumeTxnsInfoProps {
  chain: string | null;
  contractAddress: string | null;
}

function formatVolume(value: string | undefined): string {
  if (value === undefined || value === null || value === "N/A") return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatTxns(value: string | undefined): string {
  if (value === undefined || value === null || value === "N/A") return "—";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

const StatBox = ({
  value,
  label,
  format = "volume",
}: {
  value: string | undefined;
  label: string;
  format?: "volume" | "txns";
}) => (
  <div className="flex flex-col items-center bg-orange-600 rounded-md px-6 py-2">
    <span className="font-bold text-md md:text-xl">
      {format === "volume" ? formatVolume(value) : formatTxns(value)}
    </span>
    <span className="text-sm md:text-md">{label}</span>
  </div>
);

export default function VolumeTxnsInfo({ chain, contractAddress }: VolumeTxnsInfoProps) {
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null);
  const [txnsData, setTxnsData] = useState<TxnsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chain || !contractAddress) return;
    if (chain.toLowerCase() !== "bsc") {
      setVolumeData(null);
      setTxnsData(null);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`/api/${chain}/volume/${contractAddress}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/${chain}/token-price/${contractAddress}`).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([vol, txns]) => {
        setVolumeData(vol);
        setTxnsData(txns);
      })
      .catch(() => {
        setVolumeData(null);
        setTxnsData(null);
      })
      .finally(() => setLoading(false));
  }, [chain, contractAddress]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-evenly gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={`v-${i}`}
              className="flex flex-col items-center bg-orange-600 rounded-md px-6 py-2 flex-1 animate-pulse min-h-[60px]"
            >
              <span className="bg-orange-500/50 rounded h-5 w-12" />
              <span className="bg-orange-500/50 rounded h-4 w-16 mt-2" />
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center justify-evenly gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={`t-${i}`}
              className="flex flex-col items-center bg-orange-600 rounded-md px-6 py-2 flex-1 animate-pulse min-h-[60px]"
            >
              <span className="bg-orange-500/50 rounded h-5 w-12" />
              <span className="bg-orange-500/50 rounded h-4 w-16 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Volume row */}
      <div className="grid grid-cols-3 items-center justify-evenly gap-4">
        <StatBox value={volumeData?.volumeTotal} label="VOLUME" format="volume" />
        <StatBox value={volumeData?.volumeBuys} label="BUYS" format="volume" />
        <StatBox value={volumeData?.volumeSells} label="SELLS" format="volume" />
      </div>
      {/* Txns row */}
      <div className="grid grid-cols-3 items-center justify-evenly gap-4">
        <StatBox value={txnsData?.txns} label="TXNS" format="txns" />
        <StatBox value={txnsData?.txnsBuys} label="BUYS" format="txns" />
        <StatBox value={txnsData?.txnsSells} label="SELLS" format="txns" />
      </div>
    </div>
  );
}
