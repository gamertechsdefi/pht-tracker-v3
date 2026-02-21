"use client";

import React, { useEffect, useState } from "react";
import {
    Clock, RotateCcw, Coins, EyeOff, Settings, Pause, UserMinus, UserCheck,
    BarChart3, Wallet, Users, History, Scale, Code, ChevronDown,
    CheckCircle2, XCircle, Shield, Info
} from "lucide-react";

interface SecurityData {
    // GoPlus shared fields
    trading_cooldown?: string;
    can_take_back_ownership?: string;
    is_mintable?: string;
    hidden_owner?: string;
    transfer_tax?: string;
    slippage_modifiable?: string;
    personal_slippage_modifiable?: string;
    transfer_pausable?: string;
    is_blacklisted?: string;
    is_whitelisted?: string;
    creator_address?: string;
    creator_balance?: string;
    lp_holders?: { address: string; tag: string; percent: string; is_locked: number }[];
    // Honeypot-specific
    is_honeypot?: string;
    is_open_source?: string;
    is_proxy?: string;
    is_anti_whale?: string;
    buy_tax?: string;
    sell_tax?: string;
    selfdestruct?: string;
    external_call?: string;
}

interface TokenInfoProps {
    chain: string | null;
    contractAddress: string | null;
}

export default function TokenInfo({ chain, contractAddress }: TokenInfoProps) {
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(false);
    const [honeypotOpen, setHoneypotOpen] = useState(false);

    const isBsc = chain === "bsc";

    useEffect(() => {
        if (!isBsc || !contractAddress) return;
        setLoading(true);
        fetch(`/api/${chain}/security/${contractAddress}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [chain, contractAddress, isBsc]);

    // ── helpers ────────────────────────────────────────────────────────────────
    const bool = (v?: string) => v === "1";



    // A single horizontal row: label left, value/badge right
    const Row = ({
        label,
        icon: Icon,
        value,
        badge,
        valueClass = "text-white",
    }: {
        label: string;
        icon: React.ElementType;
        value?: React.ReactNode;
        badge?: { text: string; color: string };
        valueClass?: string;
    }) => (
        <div className="flex flex-row justify-between items-center py-1.5 border-b border-white/5 last:border-0">
            <span className="flex items-center gap-1.5 text-white text-md">
                {/* <Icon size={12} className="text-white flex-shrink-0" /> */}
                {label}
            </span>
            {badge ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.text}
                </span>
            ) : (
                <span className={`text-xs font-semibold ${valueClass}`}>{value}</span>
            )}
        </div>
    );

    // A boolean row
    const BoolRow = ({
        label,
        icon: Icon,
        flagged,
        trueLabel,
        falseLabel,
        flagClass = "text-red-400",
        safeClass = "text-green-400",
    }: {
        label: string;
        icon: React.ElementType;
        flagged: boolean;
        trueLabel: string;
        falseLabel: string;
        flagClass?: string;
        safeClass?: string;
    }) => (
        <div className="flex flex-row justify-between items-center py-1.5 border-b border-white/5 last:border-0">
            <span className="flex items-center gap-1.5 text-white text-md">
                {/* <Icon size={14} className="text-white flex-shrink-0" /> */}
                {label}
            </span>
            <span className={`flex items-center gap-1 text-md font-semibold ${flagged ? flagClass : safeClass}`}>
                {flagged ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                {flagged ? trueLabel : falseLabel}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-1 text-md">
            {/* ── Static placeholder rows always shown ── */}
            {/* (These stay visible even when not BSC / not loaded) */}

            {/* ── GoPlus Security section (BSC only) ── */}
            {isBsc && (
                <>
                    {loading && (
                        <div className="flex flex-col gap-1 animate-pulse mt-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-6 bg-white/5 rounded" />
                            ))}
                        </div>
                    )}

                    {!loading && data && (
                        <>

                            {/* ── GOPLUS security flags ── */}
                            <BoolRow label="Trading Cooldown" icon={Clock} flagged={bool(data.trading_cooldown)} trueLabel="Active" falseLabel="None" flagClass="text-yellow-400" />
                            <BoolRow label="Ownership Renounced" icon={RotateCcw} flagged={bool(data.can_take_back_ownership)} trueLabel="No" falseLabel="Yes" />
                            <BoolRow label="Mintable" icon={Coins} flagged={bool(data.is_mintable)} trueLabel="Yes" falseLabel="No" flagClass="text-yellow-400" />
                            <BoolRow label="Slippage Modifiable" icon={Settings} flagged={bool(data.slippage_modifiable)} trueLabel="No" falseLabel="Yes" flagClass="text-yellow-400" />
                            <BoolRow label="Blacklist Enabled" icon={UserMinus} flagged={bool(data.is_blacklisted)} trueLabel="Yes" falseLabel="No" flagClass="text-yellow-400" />
                            <BoolRow label="Whitelist Enabled" icon={UserCheck} flagged={false} trueLabel="Yes" falseLabel={bool(data.is_whitelisted) ? "Yes" : "No"} safeClass={bool(data.is_whitelisted) ? "text-red-500" : "text-green-500"} />

                            {/* ── Numeric / address fields ── */}
                            <Row
                                label="Transfer Tax"
                                icon={BarChart3}
                                value={`${(parseFloat(data.transfer_tax || "0") * 100).toFixed(2)}%`}
                            />
                            <Row
                                label="Creator Balance"
                                icon={Wallet}
                                value={`${parseFloat(data.creator_balance || "0").toFixed(4)} ${(chain ?? "").toUpperCase()}`}
                            />
                            <Row
                                label="LP Holders"
                                icon={Users}
                                value={data.lp_holders?.length ?? 0}
                            />
                            {data.creator_address && (
                                <Row
                                    label="Creator"
                                    icon={History}
                                    value={`${data.creator_address.slice(0, 6)}...${data.creator_address.slice(-4)}`}
                                    valueClass="text-neutral-300 font-mono"
                                />
                            )}
                        </>
                    )}

                    {/* ── HONEYPOT (collapsible) ── */}
                    {!loading && data && (
                        <div className="mt-1">
                            <button
                                onClick={() => setHoneypotOpen((o) => !o)}
                                className="w-full flex flex-row justify-between items-center py-1.5 border-b border-white/5 hover:bg-white/5 transition-colors rounded px-0.5"
                            >
                                <span className="flex font-bold items-center gap-1.5 text-white text-xl">
                                    <Shield size={12} className="text-neutral-500 flex-shrink-0" />
                                    Honeypot
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bool(data.is_honeypot) ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                                        {bool(data.is_honeypot) ? "RISKY" : "SAFE"}
                                    </span>
                                    <ChevronDown
                                        size={13}
                                        className={`text-white transition-transform duration-200 ${honeypotOpen ? "rotate-180" : ""}`}
                                    />
                                </span>
                            </button>

                            {/* Honeypot expanded rows */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${honeypotOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
                                <div className="pl-4 mt-1 flex flex-col border-l border-white/10 ml-1">
                                    <BoolRow label="Honeypot Detected" icon={Shield} flagged={bool(data.is_honeypot)} trueLabel="Yes" falseLabel="No" />
                                    <BoolRow label="Open Source" icon={Code} flagged={!bool(data.is_open_source)} trueLabel="Not Verified" falseLabel="Verified" flagClass="text-yellow-400" />
                                    <BoolRow label="Proxy Contract" icon={Info} flagged={bool(data.is_proxy)} trueLabel="Yes" falseLabel="No" flagClass="text-yellow-400" safeClass="text-green-400" />
                                    <BoolRow label="Anti-Whale" icon={UserMinus} flagged={false} trueLabel="Active" falseLabel={bool(data.is_anti_whale) ? "Active" : "None"} safeClass={bool(data.is_anti_whale) ? "text-blue-400" : "text-white"} />
                                    <BoolRow label="Transfer Pausable" icon={Pause} flagged={bool(data.transfer_pausable)} trueLabel="Yes" falseLabel="No" flagClass="text-yellow-400" />
                                    <BoolRow label="Hidden Owner" icon={EyeOff} flagged={bool(data.hidden_owner)} trueLabel="Yes" falseLabel="No" />
                                    <Row
                                        label="Buy Tax"
                                        icon={Scale}
                                        value={`${(parseFloat(data.buy_tax || "0") * 100).toFixed(1)}%`}
                                        valueClass={(parseFloat(data.buy_tax || "0") * 100) > 10 ? "text-red-400" : "text-green-400"}
                                    />
                                    <Row
                                        label="Sell Tax"
                                        icon={Scale}
                                        value={`${(parseFloat(data.sell_tax || "0") * 100).toFixed(1)}%`}
                                        valueClass={(parseFloat(data.sell_tax || "0") * 100) > 10 ? "text-red-400" : "text-green-400"}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}