"use client";

import { useState, useEffect } from "react";

export interface WatchlistToken {
    contract: string;
    chain: string;
    symbol: string;
    name: string;
    logo?: string;
}

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<WatchlistToken[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("watchlist");
        if (stored) {
            try {
                setWatchlist(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    const saveWatchlist = (newWatchlist: WatchlistToken[]) => {
        setWatchlist(newWatchlist);
        localStorage.setItem("watchlist", JSON.stringify(newWatchlist));
    };

    const addToWatchlist = (token: WatchlistToken) => {
        if (!watchlist.some((t) => t.contract === token.contract)) {
            const newWatchlist = [...watchlist, token];
            saveWatchlist(newWatchlist);
            return true;
        }
        return false;
    };

    const removeFromWatchlist = (contractAddress: string) => {
        const newWatchlist = watchlist.filter((t) => t.contract !== contractAddress);
        saveWatchlist(newWatchlist);
    };

    const isWatched = (contractAddress: string) => {
        return watchlist.some((t) => t.contract === contractAddress);
    };

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isWatched,
    };
}
