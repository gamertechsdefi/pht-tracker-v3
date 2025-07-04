'use client'

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define interfaces for data structures
interface Token {
    symbol: string;
    fullName: string;
    chain: string;
    volume24h: number;
    priceChange24h: string | undefined; // Keep as string | undefined to match API
}

interface Suggestion {
    fullName: string;
    symbol: string;
}

// Token list with chain mapping
const TOKEN_LIST: { [key: string]: string } = {
    pht: "bsc",
    wkc: "bsc",
    dtg: "bsc",
    war: "bsc",
    yukan: "bsc",
    btcdragon: "bsc",
    ocicat: "bsc",
    nene: "bsc",
    twc: "bsc",
    durt: "bsc",
    gtan: "bsc",
    zedek: "bsc",
    tkc: "bsc",
    twd: "bsc",
    bcat: "bsc",
    bengcat: "bsc",
    nct: "bsc",
    kitsune: "bsc",
    bft: "bsc",
    crystalstones: "bsc",
    cross: "bsc",
    thc: "bsc",
};

// Full name to symbol mapping for suggestions
const FULL_NAME_MAP: { [key: string]: string } = {
    "Phoenix Token": "pht",
    "WikiCat Coin ": "wkc",
    "Defi Tiger Token": "dtg",
    "Water Rabbit Token": "war",
    "Yukan Token": "yukan",
    "BTC Dragon Token": "btcdragon",
    "OciCat Token": "ocicat",
    "Nene": "nene",
    "TIWI CAT": "twc",
    "The Word Token": "twd",
    "The Kingdom Coin": "tkc",
    "Dutch Rabbit": "durt",
    "Giant Token": "gtan",
    "Zedek Token": "zedek",
    "Billicat Token ": "bcat",
    "Bengal Cat Token": "bengcat",
    "New Cat Token": "nct",
    "Kitsune Token": "kitsune",
    "Crystal Stones": "crystalstones",
    "The Big Five Token": "bft",
    "Cross Token": "cross",
    "Transhuman Coin": "thc",
};

export default function Header() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [search, setSearch] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortMetric, setSortMetric] = useState<"volume" | "priceChange">("volume");

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSearch = (tokenFromSearchBar: string = search): void => {
        const token = tokenFromSearchBar.trim().toLowerCase();
        console.log("handleSearch called with:", token);
        if (token && TOKEN_LIST[token]) {
            const chain = TOKEN_LIST[token];
            console.log("Navigating to:", { chain, token });
            router.push(`/${chain}/${token}`);
        } else {
            console.log("Search token not found in TOKEN_LIST:", token);
            setError(`Token "${token}" not found`);
        }
    };

    const onSuggestionClick = (suggestion: Suggestion) => {
        const symbol = suggestion.symbol;
        if (symbol) {
            setSearch(symbol);
            console.log("Suggestion selected, search set to:", symbol);
            handleSearch(symbol);
            setSuggestions([]);
            setIsSearchOpen(false);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        console.log("Input changed, search set to:", value.toLowerCase());

        if (value.trim()) {
            const filteredSuggestions = Object.entries(FULL_NAME_MAP)
                .filter(
                    ([fullName, symbol]) =>
                        fullName.toUpperCase().includes(value.toUpperCase()) ||
                        symbol.toUpperCase().includes(value.toUpperCase())
                )
                .map(([fullName, symbol]) => ({ fullName, symbol }));
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        async function fetchTrendingTokens() {
            if (!isSearchOpen) return;

            setIsLoading(true);
            setError(null);

            try {
                const tokenSymbols = Object.keys(TOKEN_LIST);
                const fetchPromises = tokenSymbols.map(async (symbol: string) => {
                    try {
                        const response = await fetch(`/api/bsc/volume/dex/${symbol}`);
                        const data: { volume: string; priceChange24h?: string; error?: string } = await response.json();
                        if (data.error || data.volume === "N/A") {
                            return null;
                        }
                        const fullName =
                            Object.keys(FULL_NAME_MAP).find(
                                (name) => FULL_NAME_MAP[name] === symbol
                            ) || symbol.toUpperCase();
                        return {
                            symbol,
                            fullName,
                            chain: TOKEN_LIST[symbol],
                            volume24h: parseFloat(data.volume) || 0,
                            priceChange24h: data.priceChange24h, // Keep as string | undefined
                        };
                    } catch (err) {
                        console.error(`Failed to fetch data for ${symbol}:`, err);
                        return null;
                    }
                });

                const results = await Promise.all(fetchPromises);
                const validTokens = results
                    .filter((token): token is Token => token !== null && token.volume24h > 0)
                    .sort((a, b) => {
                        if (sortMetric === "volume") {
                            return b.volume24h - a.volume24h;
                        } else {
                            const aChange = parseFloat(a.priceChange24h || "0") || 0;
                            const bChange = parseFloat(b.priceChange24h || "0") || 0;
                            return bChange - aChange;
                        }
                    })
                    .slice(0, 5); // Top 5 tokens

                setTrendingTokens(validTokens);
                if (validTokens.length === 0) {
                    setError("No data available for trending tokens");
                }
            } catch (err) {
                console.error("Error fetching trending tokens:", err);
                setError("Failed to load trending tokens");
            } finally {
                setIsLoading(false);
            }
        }

        fetchTrendingTokens();
    }, [isSearchOpen, sortMetric]);

    return (
        <header className="sticky top-4 z-50 mx-4 px-4 py-2 rounded-md bg-white text-neutral-900">
            <nav className="flex flex-row justify-between items-center">
                <Link href="/" className="font-bold flex flex-row items-center">
                    <Image
                        src="/logo-fixed.png"
                        alt="FireScreener Logo"
                        width={25}
                        height={25}
                        className="mr-2"
                    />
                    FIRESCREENER
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex flex-row gap-8 items-center">
                    <Link href="#" className="hover:text-neutral-700 transition-colors duration-200">Home</Link>
                    <Link href="#" className="hover:text-neutral-700 transition-colors duration-200">Burns</Link>
                    <Link href="https://www.phoenixtoken.community" className="hover:text-neutral-700 transition-colors duration-200">Token</Link>
                </div>
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition duration-200"
                    aria-label="Search Tokens"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </button>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden flex items-center p-2 border border-neutral-300 rounded text-neutral-900"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </nav>

            {/* Mobile Menu */}
            <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-white border-t border-neutral-200 mt-2`}>
                <div className="">
                    <Link
                        href="#"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Home
                    </Link>
                    <Link
                        href="#"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Burns
                    </Link>
                    <Link
                        href="https://www.phoenixtoken.community"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Phoenix Token
                    </Link>
                </div>
            </div>

            {/* Search Popup */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-neutral-900 rounded-md shadow-lg w-full max-w-lg p-6 relative border-2 border-orange-500">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsSearchOpen(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-orange-500"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tokens (e.g., WKC or WikiCat)"
                                value={search}
                                onChange={onChange}
                                className="w-full pl-10 pr-4 py-2 bg-neutral-800 text-white border-2 border-orange-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
                                autoFocus
                            />
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <ul className="bg-neutral-800 border-2 border-orange-500 rounded-md max-h-40 overflow-y-auto mb-4">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        onClick={() => onSuggestionClick(suggestion)}
                                        className="px-4 py-2 hover:bg-neutral-700 cursor-pointer flex justify-between items-center"
                                    >
                                        <div>
                                            <span className="font-medium text-white">{suggestion.fullName}</span>
                                            <span className="text-gray-400 text-sm ml-2">{suggestion.symbol.toUpperCase()}</span>
                                        </div>
                                        <span className="text-gray-400 text-xs uppercase">
                                            {TOKEN_LIST[suggestion.symbol] || "Unknown"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Trading Volume/Price Change Ranking */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-white">
                                    Top Tokens by {sortMetric === "volume" ? "24h Trading Volume" : "24h Price Change"}
                                </h3>
                                <select
                                    value={sortMetric}
                                    onChange={(e) => setSortMetric(e.target.value as "volume" | "priceChange")}
                                    className="bg-neutral-800 text-white border-2 border-orange-500 rounded-md p-1 focus:outline-none"
                                >
                                    <option value="volume">24h Volume</option>
                                    <option value="priceChange">24h Price Change</option>
                                </select>
                            </div>
                            <div className="bg-neutral-800 rounded-md overflow-hidden border-2 border-orange-500">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div
                                            className="animate-spin inline-block w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full"
                                            role="status"
                                        >
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-4 text-red-500">{error}</div>
                                ) : trendingTokens.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-neutral-900">
                                            <tr>
                                                <th className="p-3 text-white">Symbol</th>
                                                <th className="p-3 text-white">Chain</th>
                                                <th className="p-3 text-right text-white">
                                                    {sortMetric === "volume" ? "24h Volume" : "24h Price Change"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trendingTokens.map((token, index) => (
                                                <tr
                                                    key={index}
                                                    onClick={() =>
                                                        onSuggestionClick({ symbol: token.symbol, fullName: token.fullName })
                                                    }
                                                    className="border-t border-orange-500 hover:bg-neutral-700 cursor-pointer"
                                                >
                                                    <td className="p-3 text-white">{token.symbol.toUpperCase()}</td>
                                                    <td className="p-3 text-gray-400">{token.chain.toUpperCase()}</td>
                                                    <td className="p-3 text-right text-white">
                                                        {sortMetric === "volume"
                                                            ? `$${token.volume24h.toLocaleString()}`
                                                            : `${token.priceChange24h || "N/A"}%`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-4 text-gray-400">
                                        No trending tokens available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}