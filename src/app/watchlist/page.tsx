"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useWatchlist } from "@/hooks/useWatchlist";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";

// Helper functions (copied from page.tsx to ensure consistent formatting)
function formatCompactNumber(value: number | string): string {
    if (typeof value === 'string') {
        value = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    }

    if (isNaN(value) || value === 0) {
        return 'N/A';
    }

    if (value >= 1e12) {
        return (value / 1e12).toFixed(2) + 'T';
    }
    if (value >= 1e9) {
        return (value / 1e9).toFixed(2) + 'B';
    }
    if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + 'M';
    }
    if (value >= 1e3) {
        return (value / 1e3).toFixed(2) + 'K';
    }
    return value.toFixed(2);
}

function formatPrice(price: number | string): { display: string; isExponential: boolean; zeros?: number; rest?: string } {
    if (price === 'N/A' || price === null || price === undefined || price === '') {
        return { display: 'N/A', isExponential: false };
    }

    let priceNum: number;
    if (typeof price === 'string') {
        const cleanedPrice = price.replace(/[^0-9.-]/g, '');
        priceNum = parseFloat(cleanedPrice);
    } else {
        priceNum = price;
    }

    if (isNaN(priceNum)) {
        return { display: 'N/A', isExponential: false };
    }

    const priceStr = priceNum.toString();

    if (priceStr.includes('.')) {
        const decimalPart = priceStr.split('.')[1];
        if (decimalPart && decimalPart.startsWith('00000')) {
            const leadingZeros = decimalPart.match(/^0+/)?.[0].length || 0;
            const restOfNumber = decimalPart.substring(leadingZeros).substring(0, 6);
            return {
                display: '$0.',
                isExponential: true,
                zeros: leadingZeros,
                rest: restOfNumber,
            };
        }
    }

    let formattedPrice: string;
    if (priceNum >= 1) {
        formattedPrice = priceNum.toFixed(2);
    } else if (priceNum >= 0.01) {
        formattedPrice = priceNum.toFixed(4);
    } else {
        formattedPrice = priceNum.toFixed(8);
    }

    return {
        display: '$' + formattedPrice,
        isExponential: false,
    };
}

interface EnrichedToken {
    symbol: string;
    name: string;
    address: string;
    chain: string;
    price: string | number;
    marketCap: string | number;
    volume: string | number;
    liquidity: string | number;
    change24h?: string | number;
}

export default function WatchlistPage() {
    const { watchlist, removeFromWatchlist } = useWatchlist();
    const [tokens, setTokens] = useState<EnrichedToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function fetchWatchlistData() {
            if (watchlist.length === 0) {
                setTokens([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch latest data for watched tokens
                const promises = watchlist.map(async (item) => {
                    try {
                        const priceRes = await fetch(`/api/${item.chain}/token-price/${item.contract}`);
                        const priceData = await priceRes.json();

                        // Add a small delay/fallback or optimized endpoint if available in future
                        // For now we fetch individually as per current architecture structure seen in token page
                        return {
                            symbol: item.symbol,
                            name: item.name,
                            address: item.contract,
                            chain: item.chain,
                            price: priceData?.price || "N/A",
                            marketCap: priceData?.marketCap || "N/A",
                            volume: priceData?.volume || "N/A",
                            liquidity: priceData?.liquidity || "N/A",
                            change24h: priceData?.change24h || "N/A"
                        };
                    } catch (e) {
                        console.error(`Failed to fetch data for ${item.symbol}`, e);
                        return {
                            symbol: item.symbol,
                            name: item.name,
                            address: item.contract,
                            chain: item.chain,
                            price: "N/A",
                            marketCap: "N/A",
                            volume: "N/A",
                            liquidity: "N/A",
                            change24h: "N/A"
                        };
                    }
                });

                const fetchedTokens = await Promise.all(promises);
                setTokens(fetchedTokens);
            } catch (error) {
                console.error("Error fetching watchlist data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (mounted) {
            fetchWatchlistData();
        }
    }, [watchlist, mounted]);

    if (!mounted) return null;

    return (
        <div className="container mx-auto min-h-screen flex flex-col">
            <Header />
            <div className="px-4 pt-8 flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">My Watchlist</h1>
                </div>

                {watchlist.length === 0 ? (
                    <div className="flex flex-row gap-2 items-center justify-center py-20 border border-neutral-800 rounded-lg bg-black/50">
                        <div className="text-2xl mb-4">⭐</div>
                        <h2 className="text-md font-bold mb-2 text-white">Your watchlist is empty</h2>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Card Layout */}
                        <div className="md:hidden flex flex-col gap-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="text-center">
                                        <div
                                            className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                                            role="status"
                                        >
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        <p className="text-white mt-4">Loading watchlist...</p>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {tokens.map((token) => {
                                        const { display, isExponential, zeros, rest } = formatPrice(token.price);
                                        const priceDisplay = display === 'N/A' ? (
                                            <span className="text-neutral-400">N/A</span>
                                        ) : isExponential ? (
                                            <>
                                                {display}0<sub>{zeros}</sub>{rest}
                                            </>
                                        ) : (
                                            display
                                        );

                                        return (
                                            <div key={`mobile-${token.chain}-${token.address}`} className="relative h-full w-full overflow-hidden rounded-lg">
                                                {/* Background Layer (Red/Delete) */}
                                                <div className="absolute inset-0 bg-red-600 flex items-center justify-start pl-6 rounded-lg">
                                                    <Trash2 className="text-white" size={24} />
                                                </div>

                                                {/* Sliding Card Layer */}
                                                <motion.div
                                                    className="bg-black/90 relative h-full w-full rounded-lg border border-orange-500/30 z-10"
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    onDragEnd={(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                                                        // Swipe Right to Remove (positive x)
                                                        if (info.offset.x > 100) {
                                                            removeFromWatchlist(token.address);
                                                        }
                                                    }}
                                                    whileTap={{ cursor: "grabbing" }}
                                                    style={{ touchAction: "none" }}
                                                >
                                                    <Link
                                                        href={`/${token.chain}/${token.address}`}
                                                        className="block p-4"
                                                        draggable={false}
                                                    >
                                                        {/* Card Header */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            {/* Left: Token Icon and Info */}
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                {/* Token Icon with Chain Badge */}
                                                                <div className="relative flex-shrink-0">
                                                                    <img
                                                                        src={`/api/${token.chain}/logo/${token.address}`}
                                                                        alt={token.symbol}
                                                                        width={48}
                                                                        height={48}
                                                                        className="rounded-full w-12 h-12 object-contain bg-black"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '/file.svg';
                                                                        }}
                                                                    />
                                                                    {/* Chain Logo Overlay */}
                                                                    <img
                                                                        src={`/${token.chain}-logo.png`}
                                                                        alt={token.chain}
                                                                        width={20}
                                                                        height={20}
                                                                        className="absolute -bottom-1 -right-1 rounded-sm border-2 border-black"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Token Symbol and Name */}
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <span className="text-white font-bold text-lg whitespace-nowrap truncate">
                                                                        {token.symbol.toUpperCase()}
                                                                    </span>
                                                                    <span className="text-neutral-200 text-xs whitespace-nowrap truncate">
                                                                        {token.name}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Right: Price */}
                                                            <div className="flex flex-col text-right flex-shrink-0 ml-2">
                                                                <span className="text-white font-semibold text-xl whitespace-nowrap">
                                                                    {priceDisplay}
                                                                </span>
                                                                {token.change24h !== 'N/A' && token.change24h !== undefined && (
                                                                    (() => {
                                                                        const change = parseFloat(String(token.change24h));
                                                                        const isPositive = change >= 0;
                                                                        return (
                                                                            <span className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                                            </span>
                                                                        );
                                                                    })()
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Metrics Row */}
                                                        <div className="flex gap-2">
                                                            {/* Volume */}
                                                            <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                                                                <div className="text-orange-500 text-xs font-medium">VOL</div>
                                                                <div className="text-white text-sm font-semibold">
                                                                    ${formatCompactNumber(token.volume)}
                                                                </div>
                                                            </div>

                                                            {/* Liquidity */}
                                                            <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                                                                <div className="text-orange-500 text-xs font-medium">LIQ.</div>
                                                                <div className="text-white text-sm font-semibold">
                                                                    ${formatCompactNumber(token.liquidity)}
                                                                </div>
                                                            </div>

                                                            {/* Market Cap */}
                                                            <div className="flex-1 border border-orange-500 rounded-lg px-3 py-2 bg-black/50">
                                                                <div className="text-orange-500 text-xs font-medium">MCAP</div>
                                                                <div className="text-white text-sm font-semibold">
                                                                    ${formatCompactNumber(token.marketCap)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Desktop: Table Layout */}
                        <div className="hidden md:block shadow rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="bg-orange-500">
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left sticky left-0 bg-orange-500 z-20 min-w-[150px]">
                                                Token
                                            </th>
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                                                Price
                                            </th>
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                                                24H Change
                                            </th>
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                                                Market Cap
                                            </th>
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                                                Liquidity
                                            </th>
                                            <th className="text-md font-semibold text-white uppercase tracking-wider px-5 py-3 text-left min-w-[120px]">
                                                24H Volume
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-10 text-white">
                                                    Loading watchlist...
                                                </td>
                                            </tr>
                                        ) : (
                                            tokens.map((token) => (
                                                <tr key={`${token.chain}-${token.address}`} className="border-b border-orange-500 hover:bg-orange-600 transition-colors">
                                                    {/* Token column - sticky on mobile */}
                                                    <td className="px-5 py-4 text-sm sticky left-0 z-10 min-w-[150px]">
                                                        <Link href={`/${token.chain}/${token.address}`} className="flex items-center hover:opacity-80">
                                                            {/* Token Icon with Chain Badge */}
                                                            <div className="relative flex-shrink-0 mr-3">
                                                                <img
                                                                    src={`/api/${token.chain}/logo/${token.address}`}
                                                                    alt={token.symbol}
                                                                    width={32}
                                                                    height={32}
                                                                    className="rounded-full w-8 h-8 object-contain bg-black"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/file.svg';
                                                                    }}
                                                                />
                                                                {/* Chain Logo Overlay */}
                                                                <img
                                                                    src={`/${token.chain}-logo.png`}
                                                                    alt={token.chain}
                                                                    width={16}
                                                                    height={16}
                                                                    className="absolute -bottom-1 -right-1 rounded-sm border-2 border-black"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-white whitespace-nowrap font-medium text-base">
                                                                    {token.symbol.toUpperCase()}
                                                                </span>
                                                                <span className="text-gray-400 text-xs whitespace-nowrap">
                                                                    {token.name}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </td>

                                                    {/* Price column */}
                                                    <td className="px-5 py-4 text-sm min-w-[120px]">
                                                        <span className="text-white whitespace-nowrap">
                                                            {token.price === 'N/A' ? 'N/A' : (() => {
                                                                const { display, isExponential, zeros, rest } = formatPrice(token.price);
                                                                if (!isExponential) return display;
                                                                return (
                                                                    <>
                                                                        {display}0<sub>{zeros}</sub>{rest}
                                                                    </>
                                                                );
                                                            })()}
                                                        </span>
                                                    </td>

                                                    {/* 24h Change column */}
                                                    <td className="px-5 py-4 text-sm min-w-[120px]">
                                                        {token.change24h === 'N/A' || token.change24h === undefined ? (
                                                            <span className="text-white whitespace-nowrap">N/A</span>
                                                        ) : (
                                                            (() => {
                                                                const change = parseFloat(String(token.change24h));
                                                                const isPositive = change >= 0;
                                                                return (
                                                                    <span className={`whitespace-nowrap font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                                    </span>
                                                                );
                                                            })()
                                                        )}
                                                    </td>

                                                    {/* Market Cap column */}
                                                    <td className="px-5 py-4 text-sm min-w-[120px]">
                                                        <span className="text-white whitespace-nowrap">
                                                            ${formatCompactNumber(token.marketCap)}
                                                        </span>
                                                    </td>

                                                    {/* Liquidity column */}
                                                    <td className="px-5 py-4 text-sm min-w-[120px]">
                                                        <span className="text-white whitespace-nowrap">
                                                            {token.liquidity === 'N/A' ? 'N/A' : `$${formatCompactNumber(token.liquidity)}`}
                                                        </span>
                                                    </td>

                                                    {/* Volume column */}
                                                    <td className="px-5 py-4 text-sm min-w-[120px]">
                                                        <span className="text-white whitespace-nowrap">
                                                            {token.volume === 'N/A' ? 'N/A' : `$${formatCompactNumber(token.volume)}`}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
