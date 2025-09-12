"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BurnApiResponse = {
  burn24h: number;
  lastUpdated: string;
};

type Row = {
  token: string;
  burn24h: number | "N/A";
  lastUpdated: string | "N/A";
};

const TOKEN_ENABLE_MAP: Record<string, boolean> = {
  pht: true,
  wkc: true,
  war: true,
  dtg: true,
  yukan: false,
  btcdragon: false,
  ocicat: true,
  nene: true,
  twc: true,
  tkc: false,
  durt: true,
  twd: true,
  gtan: false,
  zedek: true,
  bengcat: true,
  bcat: false,
  nct: false,
  kitsune: false,
  crystalstones: true,
  bft: false,
  cross: true,
  thc: false,
  bbft: false,
  puffcat: false,
  crepe: true,
  popielno: true,
  spray: true,
  mbc: true,
  mars: false,
  sdc: false,
  kind: true,
  shibc: true,
  pcat: true,
  egw: false,
  "1000pdf": true,
  aidove: false,
  rbcat: true,
};

// If you want to hard-freeze which tokens show by default, keep this list in sync
// with the entries enabled in TOKEN_ENABLE_MAP (or just rely on TOKEN_ENABLE_MAP).
const DEFAULT_TOKENS: string[] = Object.keys(TOKEN_ENABLE_MAP).filter(
  (t) => TOKEN_ENABLE_MAP[t]
);

// All these tokens are BSC per your codebase. If later you add Solana tokens,
// you can extend this map or derive it dynamically.
const TOKEN_CHAIN_MAP: Record<string, string> = DEFAULT_TOKENS.reduce(
  (acc, t) => {
    acc[t] = "bsc";
    return acc;
  },
  {} as Record<string, string>
);

function formatCompactNumber(n: number | string): string {
  if (n === "N/A") return "N/A";
  const num = typeof n === "number" ? n : parseFloat(n);
  if (!isFinite(num)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: num >= 1_000_000 ? 1 : 0,
  }).format(num);
}

function formatRelativeTime(iso: string | "N/A"): string {
  if (iso === "N/A") return "N/A";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "N/A";
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - then) / 1000)); // seconds
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function BurnsLeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Active tokens follow the order in TOKEN_ENABLE_MAP (already filtered by DEFAULT_TOKENS)
  const activeTokens = DEFAULT_TOKENS;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          activeTokens.map(async (t) => {
            try {
              const chain = TOKEN_CHAIN_MAP[t] ?? "bsc";
              const resp = await fetch(`/api/${chain}/total-burnt/${t}`);
              if (!resp.ok) {
                return {
                  token: t,
                  burn24h: "N/A" as const,
                  lastUpdated: "N/A" as const,
                };
              }
              const data = (await resp.json()) as BurnApiResponse;
              return {
                token: t,
                burn24h:
                  typeof data.burn24h === "number" && isFinite(data.burn24h)
                    ? data.burn24h
                    : (0 as number),
                lastUpdated: data.lastUpdated ?? "N/A",
              };
            } catch {
              return {
                token: t,
                burn24h: "N/A" as const,
                lastUpdated: "N/A" as const,
              };
            }
          })
        );

        if (!isMounted) return;

        setRows(results);
      } catch (e: unknown) {
        if (isMounted) {
          setError(
            e instanceof Error ? e.message : "Failed to load burns leaderboard"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [activeTokens, refreshTick]);

  return (
    <main className="px-4 md:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">24h Burns Leaderboard</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border border-neutral-700 rounded-md overflow-hidden">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">24h Burnt</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-4 text-red-500" colSpan={4}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4" colSpan={4}>
                  No tokens to display.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.token}
                  className="border-t border-neutral-700 hover:bg-neutral-900/50"
                >
                  <td className="px-4 py-3 font-semibold">
                    {r.token.toUpperCase()}
                  </td>

                  <td className="px-4 py-3">
                    {r.burn24h === "N/A" ? "N/A" : formatCompactNumber(r.burn24h)}
                  </td>
                  <td className="px-4 py-3">{formatRelativeTime(r.lastUpdated)}</td>
                  <td className="px-4 py-3">
                    {/* These tokens are BSC in your codebase */}
                    <Link
                      href={`/${TOKEN_CHAIN_MAP[r.token] ?? "bsc"}/${r.token}`}
                      className="text-orange-500 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

   
    </main>
  );
}