"use client";

import React, { useEffect, useRef, useState } from "react";
import { Lock, LockOpen, ChevronDown, ExternalLink } from "lucide-react";

interface LPHolder {
    address: string;
    tag: string;
    percent: string;
    is_locked: number;
    locked_detail?: Array<{
        amount?: string;
        end_time?: string;
        opt_time?: string;
    }>;
}

interface SecurityData {
    lp_holders?: LPHolder[];
    is_in_dex?: string;
}

interface LiquidityLockerProps {
    chain: string;
    contractAddress: string;
}

const LiquidityLocker: React.FC<LiquidityLockerProps> = ({ chain, contractAddress }) => {
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Only render for BSC
    if (chain !== "bsc") return null;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/${chain}/security/${contractAddress}`);
                if (!res.ok) return;
                const json = await res.json();
                setData(json);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chain, contractAddress]);

    // Close popover on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 animate-pulse w-fit">
                <div className="w-4 h-4 rounded bg-white/10" />
                <div className="w-16 h-3 rounded bg-white/10" />
            </div>
        );
    }

    if (!data) return null;

    const lpHolders = data.lp_holders ?? [];
    const locked = lpHolders.filter((h) => h.is_locked === 1);
    const lockedPct = locked.reduce((sum, h) => sum + parseFloat(h.percent || "0") * 100, 0);
    const roundedPct = Math.min(lockedPct, 100).toFixed(1);
    const isSafe = lockedPct >= 80;
    const isPartial = lockedPct > 0 && lockedPct < 80;

    // Deduplicate platforms from locked LP holders
    const platforms: { name: string; pct: number }[] = [];
    const seen = new Set<string>();
    for (const holder of locked) {
        const name = holder.tag || holder.address.slice(0, 6) + "..." + holder.address.slice(-4);
        const key = name.toLowerCase();
        if (seen.has(key)) {
            const existing = platforms.find((p) => p.name.toLowerCase() === key);
            if (existing) existing.pct += parseFloat(holder.percent || "0") * 100;
        } else {
            seen.add(key);
            platforms.push({ name, pct: parseFloat(holder.percent || "0") * 100 });
        }
    }

    const LockIcon = lockedPct === 0 ? LockOpen : Lock;
    const colorClass = isSafe
        ? "text-green-400 border-green-500/30 bg-green-500/10"
        : isPartial
            ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
            : "text-red-400 border-red-500/30 bg-red-500/10";

    const barColor = isSafe ? "bg-green-500" : isPartial ? "bg-yellow-400" : "bg-red-500";

    return (
        <div className="relative w-fit" ref={popoverRef}>
            <button
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 hover:brightness-110 ${colorClass}`}
            >
                <LockIcon size={13} />
                <span>LP {roundedPct}% Locked</span>
                <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Popover */}
            {open && (
                <div className="absolute left-0 top-full mt-2 z-50 min-w-[220px] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Progress bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                            <span>Lock Ratio</span>
                            <span className={isSafe ? "text-green-400" : isPartial ? "text-yellow-400" : "text-red-400"}>
                                {roundedPct}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(lockedPct, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Platform list */}
                    {platforms.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Lock Platforms</p>
                            {platforms.map((p) => (
                                <div
                                    key={p.name}
                                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-white/5"
                                >
                                    <span className="text-xs text-white font-medium truncate">{p.name}</span>
                                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                                        {p.pct.toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-neutral-500 text-center">No locked LP holders found</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LiquidityLocker;
