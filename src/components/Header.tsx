'use client'

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
    bbft: "bsc",
    surv: "bsc",
    bob: "bsc",
    tut: "bsc",
    puffcat: "bsc",
    crepe: "bsc",
    popielno: "bsc",
    spray: "bsc",
    mbc: "bsc",
    mars: "bsc",
    sdc: "bsc",
    kind: "bsc",
    shibc: "bsc",
    pcat: "bsc",
    egw: "bsc",
    "1000pdf": "bsc",
    aidove: "bsc",
    hmt: "bsc",
    rbcat: "bsc",
    bbcat: "bsc",
    cct: "bsc",
    talent: "bsc",
    jawgular: "bsc",
    dst: "bsc",
    zoe: "bsc",
    godinu: "bsc",
    peperice: "bsc",
    bp: "bsc",
    lai: "bsc",
    babydew: "bsc",
    sat: "bsc",
    orb: "bsc",
    captainbnb: "bsc",
    anndy: "bsc",
    light: "bsc",
    zonic: "bsc",

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
    "Baby BFT": "bbft",
    "Survarium": "surv",
    "Build on BNB": "bob",
    "Tutorial Token": "tut",
    "PuffCat Token": "puffcat",
    "CREPE": "crepe",
    "POPIELNO": "popielno",
    "SPRAY LOTTERY TOKEN": "spray",
    "Mamba Token": "mbc",
    "Matara Token": "mars",
    "SIDE CHICK": "sdc",
    "KIND CAT TOKEN": "kind",
    "AIShibCeo": "shibc",
    "Phenomenal Cat": "pcat",
    "Eagles Wings": "egw",
    "1000PDF Token": "1000pdf",
    "AiDove": "aidove",
    "HawkMoon Token": "hmt",
    "Russian Blue Cat": "rbcat",
    "Baby BilliCat": "bbcat",
    "CatCake Token": "cct",
    "Talent Token": "talent",
    "Persian Cat Token": "pcat",
    "ZOE Token": "zoe",
    "JAWGULAR": "jawgular",
    "GOD INU": "godinu",
    "Pepe Rice": "peperice",
    "DayStar Token": "dst",
    "Baby Priceless": "bp",
    "LeadAI Token": "lai",
    "BABY DEW": "babydew",
    "SATERIA": "sat",
    "ORBITAL": "orb",
    "CaptainBNB": "captainbnb",
    "首席模因官": "anndy",
    "Luminous Token": "light",
    "Zion Token": "zonic",
};

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
    const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
    const [search, setSearch] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortMetric, setSortMetric] = useState<"volume" | "priceChange">("volume");

    // Determine active chain from pathname
    const getActiveChain = (): string | null => {
        const path = pathname?.toLowerCase() || '';
        if (path.startsWith('/bsc')) return 'bsc';
        if (path.startsWith('/rwa')) return 'rwa';
        if (path.startsWith('/sol')) return 'sol';
        return null; // Home page or other routes
    };

    const activeChain = getActiveChain();

    // Get chain display info
    const getChainInfo = (chain: string | null) => {
        if (!chain) return { name: 'All Chains', logo: null };
        const chainInfo: { [key: string]: { name: string; logo: string } } = {
            bsc: { name: 'BSC Chain', logo: '/bsc-logo.png' },
            rwa: { name: 'RWA Chain', logo: '/rwa-logo.png' },
            sol: { name: 'Solana', logo: '/sol-logo.png' },
        };
        return chainInfo[chain] || { name: 'All Chains', logo: null };
    };

    const currentChainInfo = getChainInfo(activeChain);

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
            if (!isSearchOpen && !isDesktopSearchFocused) return;

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
    }, [isSearchOpen, isDesktopSearchFocused, sortMetric]);

    return (
        <header className="sticky top-0 z-50 px-4 md:px-16 py-2 bg-white text-neutral-900">
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

                {/* Desktop Search (Center) - Replaces the old Nav Links */}
                <div className="hidden md:flex flex-1 max-w-2xl mx-8 relative z-50">
                    <div className="relative w-full">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                                placeholder="Search tokens (e.g., WKC or WikiCat)..."
                                value={search}
                                onChange={onChange}
                                onFocus={() => setIsDesktopSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsDesktopSearchFocused(false), 200)}
                                className="w-full pl-10 pr-4 py-2 bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
                            />
                        </div>

                        {/* Desktop Search Suggestions/Trending Dropdown */}
                        {isDesktopSearchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-orange-500 rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto w-full">
                                {/* Suggestions */}
                                {suggestions.length > 0 && (
                                    <ul className="bg-neutral-800 border-2 border-orange-500 rounded-md max-h-40 overflow-y-auto mb-4">
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                onMouseDown={() => onSuggestionClick(suggestion)}
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

                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold text-white">
                                        Top Tokens
                                    </h3>
                                </div>

                                {isLoading ? (
                                    <div className="text-center py-4 text-white">Loading...</div>
                                ) : trendingTokens.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-neutral-900">
                                            <tr>
                                                <th className="p-3 text-white">Symbol</th>
                                                <th className="p-3 text-white">Chain</th>
                                                <th className="p-3 text-right text-white">24h Vol</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trendingTokens.map((token, index) => (
                                                <tr
                                                    key={index}
                                                    onMouseDown={() =>
                                                        onSuggestionClick({ symbol: token.symbol, fullName: token.fullName })
                                                    }
                                                    className="border-t border-orange-500 hover:bg-neutral-700 cursor-pointer"
                                                >
                                                    <td className="p-3 text-white">{token.symbol.toUpperCase()}</td>
                                                    <td className="p-3 text-gray-400">{token.chain.toUpperCase()}</td>
                                                    <td className="p-3 text-right text-white">
                                                        ${token.volume24h.toLocaleString()}
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
                        )}
                    </div>
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    {/* Chain Selector Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition duration-200 ${activeChain
                                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                                }`}
                            aria-label="Select Chain"
                        >
                            {activeChain && currentChainInfo.logo ? (
                                <Image
                                    src={currentChainInfo.logo}
                                    alt={activeChain}
                                    width={20}
                                    height={20}
                                    className="rounded-sm"
                                />
                            ) : (
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    />
                                </svg>
                            )}
                            <span className="hidden sm:inline text-sm font-medium">
                                {activeChain ? currentChainInfo.name : 'Chains'}
                            </span>
                            <svg
                                className={`h-4 w-4 transition-transform duration-200 ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isChainDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsChainDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                                    <Link
                                        href="/bsc"
                                        className={`flex items-center gap-3 px-4 py-2 transition-colors duration-200 ${activeChain === 'bsc'
                                                ? 'bg-orange-100 text-orange-900 font-semibold'
                                                : 'hover:bg-neutral-100'
                                            }`}
                                        onClick={() => setIsChainDropdownOpen(false)}
                                    >
                                        <Image
                                            src="/bsc-logo.png"
                                            alt="BSC"
                                            width={24}
                                            height={24}
                                        />
                                        <span className="text-sm font-medium">BSC Chain</span>
                                        {activeChain === 'bsc' && (
                                            <svg
                                                className="h-4 w-4 ml-auto text-orange-600"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </Link>
                                    <Link
                                        href="/rwa"
                                        className={`flex items-center gap-3 px-4 py-2 transition-colors duration-200 ${activeChain === 'rwa'
                                                ? 'bg-orange-100 text-orange-900 font-semibold'
                                                : 'hover:bg-neutral-100'
                                            }`}
                                        onClick={() => setIsChainDropdownOpen(false)}
                                    >
                                        <Image
                                            src="/rwa-logo.png"
                                            alt="RWA"
                                            width={24}
                                            height={24}
                                        />
                                        <span className="text-sm font-medium">RWA Chain</span>
                                        {activeChain === 'rwa' && (
                                            <svg
                                                className="h-4 w-4 ml-auto text-orange-600"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </Link>

                                    <div className="border-t border-neutral-200 my-2"></div>
                                    <Link
                                        href="/"
                                        className={`flex items-center gap-3 px-4 py-2 transition-colors duration-200 ${!activeChain
                                                ? 'bg-orange-100 text-orange-900 font-semibold'
                                                : 'hover:bg-neutral-100'
                                            }`}
                                        onClick={() => setIsChainDropdownOpen(false)}
                                    >
                                        <svg
                                            className="h-5 w-5 text-neutral-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        </svg>
                                        <span className="text-sm font-medium">All Chains</span>
                                        {!activeChain && (
                                            <svg
                                                className="h-4 w-4 ml-auto text-orange-600"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search Button (Mobile Only) */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="md:hidden flex items-center bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition duration-200"
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

                    {/* Desktop Menu Dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg transition duration-200"
                        >
                            <span className="font-medium">Menu</span>
                            <svg className={`h-4 w-4 transition-transform ${isDesktopMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDesktopMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDesktopMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                                    <Link href="#" className="block px-4 py-2 hover:bg-neutral-100 text-neutral-900" onClick={() => setIsDesktopMenuOpen(false)}>Home</Link>
                                    <Link href="#" className="block px-4 py-2 hover:bg-neutral-100 text-neutral-900" onClick={() => setIsDesktopMenuOpen(false)}>Burns</Link>
                                    <Link href="/price-predict" className="block px-4 py-2 hover:bg-neutral-100 text-neutral-900" onClick={() => setIsDesktopMenuOpen(false)}>Price Predict</Link>
                                    <Link href="/watchlist" className="block px-4 py-2 hover:bg-neutral-100 text-neutral-900" onClick={() => setIsDesktopMenuOpen(false)}>Watchlist</Link>
                                    <Link href="https://www.phoenixtoken.community" className="block px-4 py-2 hover:bg-neutral-100 text-neutral-900" onClick={() => setIsDesktopMenuOpen(false)}>Token</Link>
                                    <div className="border-t border-neutral-200 my-2"></div>
                                    {/* <Link href="/auth/login" className="block px-4 py-2 hover:bg-neutral-100 text-orange-600 font-medium" onClick={() => setIsDesktopMenuOpen(false)}>Login</Link>
                                    <Link href="/auth/signup" className="block px-4 py-2 hover:bg-neutral-100 text-orange-600 font-medium" onClick={() => setIsDesktopMenuOpen(false)}>Signup</Link> */}
                                </div>
                            </>
                        )}
                    </div>

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
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-white border-t border-neutral-200 mt-2`}>
                <div className="">
                    <Link
                        href="https://firescreener.com"
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
                        href="/price-predict"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Price2MC
                    </Link>
                    <Link
                        href="/watchlist"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Watchlist
                    </Link>
                    <Link
                        href="https://www.phoenixtoken.community"
                        className="block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Phoenix Token
                    </Link>
                    {/* <Link
                        href="/auth/login"
                        className="text-orange-600 font-bold block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Login
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="text-orange-600 font-bold block px-3 py-2 rounded-md text-base text-neutral-900 hover:text-neutral-700 hover:bg-neutral-100"
                        onClick={toggleMenu}
                    >
                        Signup
                    </Link> */}
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