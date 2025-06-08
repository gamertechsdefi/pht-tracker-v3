"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DataCard from "@/components/DataCard";
import SearchBarPopup from "@/components/SearchBar";
import BurnsDisplay from "@/components/BurnHistory";
import styles from '../styles.module.css';
import Footer from "@/components/Footer";

// Define types for token data and intervals
interface TokenData {
    price: string | number;
    totalSupply: string | number;
    cSupply: string | number;
    lSupply: string | number;
    holders: string | number;
    marketCap: string | number;
    volume: string | number;
    burn5min: string | number;
    burn15min: string | number;
    burn30min: string | number;
    burn1h: string | number;
    burn3h: string | number;
    burn6h: string | number;
    burn12h: string | number;
    burn24h: string | number;
    totalburnt: string | number;
    priceChange24h: string | number;
    priceChange6h: string | number;
    priceChange3h: string | number;
    priceChange1h: string | number;
    liquidity: string | number;
    profile: string;
}

interface BurnInterval {
    value: BurnIntervalKey;
    label: string;
}


type BurnIntervalKey =
    | "burn5min"
    | "burn15min"
    | "burn30min"
    | "burn1h"
    | "burn3h"
    | "burn6h"
    | "burn12h"
    | "burn24h";

// Token-to-chain mapping
const TOKEN_LIST: Record<string, string> = {
    pht: "bsc",
    wkc: "bsc",
    war: "bsc",
    dtg: "bsc",
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
    nct: "bsc",
    kitsune: "bsc",
    bengcat: "bsc",
    scat: "sol",
    petros: "sol",
    nuke: "sol",
    venus: "sol",
    crystalstones: "bsc",
    bft: "bsc",
    cross: "bsc",
    thc: "bsc",
};

// Token abbreviation to full name mapping
const TOKEN_FULL_NAMES: Record<string, string> = {
    pht: "Phoenix Token",
    wkc: "WikiCat Coin",
    war: "Water Rabbit Token",
    dtg: "Defi Tiger Token",
    yukan: "Yukan Token",
    btcdragon: "BTCDragon Token",
    ocicat: "Ocicat Token",
    nene: "Nene Token",
    twc: "TiwiCat Coin",
    durt: "Dutch Rabbit Token",
    gtan: "Giant Token",
    zedek: "Zedek Token",
    tkc: "The Kingdom Coin",
    twd: "The Word Token",
    bcat: "BilliCat Token",
    nct: "New Cat Token",
    kitsune: "Kitsune Token",
    bengcat: "Bengal Cat Token",
    scat: "Solana Cat Token",
    petros: "Petros Token",
    nuke: "Nuke Token",
    venus: "Two Face Cat",
    crystalstones: "Crystal Stones",
    bft: "Big Five Token",
    cross: "Cross Token",
    thc: "Transhuman Coin",
};

// Define burn interval options
const BURN_INTERVALS: BurnInterval[] = [
    { value: "burn5min", label: "5 Minutes" },
    { value: "burn15min", label: "15 Minutes" },
    { value: "burn30min", label: "30 Minutes" },
    { value: "burn1h", label: "1 Hour" },
    { value: "burn3h", label: "3 Hours" },
    { value: "burn6h", label: "6 Hours" },
    { value: "burn12h", label: "12 Hours" },
    { value: "burn24h", label: "24 Hours" },
];

// Define props interface
interface TokenPageProps {
    params: Promise<{ chain: string; tokenName: string }>;
}

export default function TokenPage({ params: paramsPromise }: TokenPageProps) {
    const router = useRouter();
    const [chain, setChain] = useState<string | null>(null);
    const [tokenName, setTokenName] = useState<string | null>(null);
    const [search, setSearch] = useState<string>("");
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBurnInterval, setSelectedBurnInterval] = useState<BurnIntervalKey>("burn24h");
    const [activeTab, setActiveTab] = useState<string>("info");

    useEffect(() => {
        if (paramsPromise) {
            Promise.resolve(paramsPromise).then((resolvedParams) => {
                const { chain: paramChain, tokenName: paramTokenName } = resolvedParams || {};
                setChain(paramChain);
                setTokenName(paramTokenName);
            });
        }
    }, [paramsPromise]);

    useEffect(() => {
        async function fetchTokenData() {
            console.log("Params received:", { chain, tokenName });

            if (!chain || !tokenName) {
                console.log("Missing chain or tokenName:", { chain, tokenName });
                setError("Invalid chain or token name");
                setLoading(false);
                return;
            }

            const token = tokenName.toLowerCase();
            const chainLower = chain.toLowerCase();

            const expectedChain = TOKEN_LIST[token];
            if (!expectedChain) {
                console.log(`Token "${token}" not found in TOKEN_LIST`);
                setError(`Token "${token}" not found`);
                setLoading(false);
                return;
            }

            if (expectedChain !== chainLower) {
                console.log(`Chain mismatch: expected "${expectedChain}", got "${chainLower}"`);
                setError(`Chain mismatch: expected "${expectedChain}", got "${chainLower}"`);
                setLoading(false);
                return;
            }

            console.log("Validation passed, fetching data for:", { chain: chainLower, token });

            try {
                const apiEndpoints = [
                    `/api/${chainLower}/token-metrics/${token}`,
                    `/api/${chainLower}/token-holders/${token}`,
                    `/api/${chainLower}/token-price/${token}`,
                    `/api/${chainLower}/burns/${token}`,
                    `/api/${chainLower}/token-profile/${token}`,
                ];
                console.log("API endpoints:", apiEndpoints);

                const responses = await Promise.all(
                    apiEndpoints.map((endpoint) =>
                        fetch(endpoint)
                            .then((res) => (res.ok ? res.json() : null))
                            .catch(() => null)
                    )
                );

                const [metricsData, holdersData, priceData, burnsData, profileData] = responses;

                setTokenData({
                    price: priceData?.price || "N/A",
                    totalSupply: metricsData?.totalSupply || "N/A",
                    cSupply: metricsData?.circulatingSupply || "N/A",
                    lSupply: metricsData?.lockedSupply || "N/A",
                    holders: holdersData?.totalHolders || "N/A",
                    marketCap: priceData?.marketCap || "N/A",
                    volume: priceData?.volume || "N/A",
                    burn5min: burnsData?.burn5min || "No burns",
                    burn15min: burnsData?.burn15min || "No burns",
                    burn30min: burnsData?.burn30min || "No burns",
                    burn1h: burnsData?.burn1h || "No burns",
                    burn3h: burnsData?.burn3h || "No burns",
                    burn6h: burnsData?.burn6h || "No burns",
                    burn12h: burnsData?.burn12h || "No burns",
                    burn24h: burnsData?.burn24h || "No burns",
                    totalburnt: metricsData?.totalBurnt || "N/A",
                    priceChange24h: priceData?.change24h || "N/A",
                    priceChange6h: priceData?.change6h || "N/A",
                    priceChange3h: priceData?.change3h || "N/A",
                    priceChange1h: priceData?.change1h || "N/A",
                    liquidity: priceData?.liquidity || "N/A",
                    profile: profileData?.profileImage || "N/A",
                });
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch token data";
                console.error("Error fetching token data:", errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        if (chain && tokenName) {
            fetchTokenData();
        }
    }, [chain, tokenName, router]);

    // Formatting functions
    const formatPrice = (price: string | number): { display: string; isExponential: boolean } => {
        try {
            if (price === null || price === undefined || price === "N/A") return { display: "N/A", isExponential: false };
            const num = parseFloat(price.toString());
            if (isNaN(num)) return { display: "N/A", isExponential: false };

            const strNum = num.toFixed(20);
            const decimalParts = strNum.split(".");
            const integerPart = decimalParts[0];
            const decimalPart = decimalParts[1] || "0";

            let leadingZeros = 0;
            let significantDigitsStart = 0;
            for (let i = 0; i < decimalPart.length; i++) {
                if (decimalPart[i] === "0") {
                    leadingZeros++;
                } else {
                    significantDigitsStart = i;
                    break;
                }
            }

            if (leadingZeros >= 4 && integerPart === "0") {
                const exponent = leadingZeros;
                const significantDigits = decimalPart.slice(significantDigitsStart).replace(/0+$/, "");
                return { display: `0.0 ${exponent} ${significantDigits}`, isExponential: true };
            }

            const maxDecimals = Math.abs(num) < 1 ? 6 : 5;
            const formatted = num.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: maxDecimals,
                useGrouping: Math.abs(num) >= 1000,
            }).replace(/\.?0+$/, "");
            return { display: formatted, isExponential: false };
        } catch (error) {
            console.error("Error in formatPrice:", error);
            return { display: "N/A", isExponential: false };
        }
    };

    const formatLargeNumber = (value: string | number, defaultValue: string = "N/A"): string => {
        try {
            if (value === null || value === undefined || value === "") return defaultValue;
            const num = parseFloat(value.toString());
            if (isNaN(num)) return defaultValue;

            return new Intl.NumberFormat("en-US", {
                notation: "compact",
                compactDisplay: "short",
                minimumFractionDigits: 0,
                maximumFractionDigits: num >= 1000000 ? 1 : 0,
            }).format(num);
        } catch (error) {
            console.error("Error in formatLargeNumber:", error);
            return defaultValue;
        }
    };

    const formatWholeNumber = (number: string | number): string => {
        try {
            if (number === null || number === undefined || number === "") return "0";
            const num = parseFloat(number.toString());
            if (isNaN(num)) return "0";
            return new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: true,
            }).format(num);
        } catch (error) {
            console.error("Error in formatWholeNumber:", error);
            return "0";
        }
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

    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedBurnInterval(e.target.value as BurnIntervalKey);
    };

    const getSelectedBurnValue = (): string => {
        if (!tokenData) return "No burns atm";
        return (tokenData[selectedBurnInterval] as string | number).toString() || "No burns atm";
    };

    const getIntervalDisplayName = (): string => {
        const interval = BURN_INTERVALS.find((item) => item.value === selectedBurnInterval);
        return interval ? interval.label : "24 Hours";
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 px-6 md:px-8 mt-8">

                {loading ? (
                    <div className="flex items-center justify-center mt-8">
                        <div className="text-center">
                            <div
                                className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
                                role="status"
                            >
                                <span className="sr-only">Loading...</span>
                            </div>
                            <h1 className="text-xl font-semibold mt-4">
                                Loading data for {tokenName?.toUpperCase() || "unknown"}...
                            </h1>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center mt-8 text-red-500 bg-gray-100 p-6 rounded-lg">
                        <h1 className="text-xl font-semibold">Error: {error}</h1>
                        <button
                            onClick={() => router.push("/")}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                        >
                            Return to Home
                        </button>
                    </div>
                ) : (
                    tokenData && (
                        <>
                            <div className="md:hidden">
                                {activeTab === "info" && (
                                    <>
                                        <section className="">
                                            <div className="flex flex-row items-center bg-black gap-2 rounded-md p-4 mb-4">
                                                <img
                                                    src={`/api/${chain}/logo/${tokenName}`}
                                                    alt={`${tokenName?.toUpperCase()} Logo`}
                                                    className="w-15 h-15 mb-2 rounded-md object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/file.svg';
                                                        (e.target as HTMLImageElement).alt = 'Default Logo';
                                                    }}
                                                />
                                                <h1 className="text-2xl font-bold">{tokenName ? TOKEN_FULL_NAMES[tokenName.toLowerCase()] || tokenName.toUpperCase() : "Unknown Token"}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Price:</h1>
                                                <h1 className="font-medium text-xl">
                                                    ${" "}
                                                    {(() => {
                                                        const { display, isExponential } = formatPrice(tokenData.price);
                                                        if (!isExponential) return display;
                                                        const [prefix, exponent, value] = display.split(" ");
                                                        return (
                                                            <>
                                                                {prefix}
                                                                <sup className={styles.superscript}>{exponent}</sup> {value}
                                                            </>
                                                        );
                                                    })()}
                                                </h1>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                    <h1>MarketCap:</h1>
                                                    <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.marketCap)}</h1>
                                                </div>
                                                <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                    <h1>Liquidity:</h1>
                                                    <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.liquidity)}</h1>
                                                </div>
                                                <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                    <h1>Volume:</h1>
                                                    <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.volume)}</h1>
                                                </div>
                                                <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                    <h1>Holders:</h1>
                                                    <h1 className="font-medium text-xl">{formatWholeNumber(tokenData.holders)}</h1>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-row bg-neutral-900 justify-between gap-2 items-center border-2 border-orange-500 rounded-md p-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-400">1h</span>
                                                    <span
                                                        className={`px-2 py-1 rounded ${String(tokenData.priceChange1h).startsWith("-") ? "text-red-400" : "text-green-400"}`}
                                                    >
                                                        {tokenData.priceChange1h}%
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-400">3h</span>
                                                    <span
                                                        className={`px-2 py-1 rounded ${String(tokenData.priceChange3h).startsWith("-") ? "text-red-500" : "text-green-500"}`}
                                                    >
                                                        {tokenData.priceChange3h}%
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-400">6h</span>
                                                    <span
                                                        className={`px-2 py-1 rounded ${String(tokenData.priceChange6h).startsWith("-") ? "text-red-600" : "text-green-600"}`}
                                                    >
                                                        {tokenData.priceChange6h}%
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-400">24h</span>
                                                    <span
                                                        className={`px-2 py-1 rounded ${String(tokenData.priceChange24h).startsWith("-") ? "text-red-700" : "text-green-700"}`}
                                                    >
                                                        {tokenData.priceChange24h}%
                                                    </span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="mt-8 flex flex-col my-16">
                                            <div className="flex-1">
                                                <div className="my-8 space-y-4">
                                                    <DataCard
                                                        title="Total Supply"
                                                        value={formatWholeNumber(tokenData.totalSupply)}
                                                        bg="bg-white text-black"
                                                        image="/tSupply.png"
                                                    />
                                                    <DataCard
                                                        title="Total Locked"
                                                        value={formatWholeNumber(tokenData.lSupply)}
                                                        bg="bg-blue-600"
                                                        image="/lock-bg.png"
                                                    />
                                                    <DataCard
                                                        title="Circulatory Supply"
                                                        value={formatWholeNumber(tokenData.cSupply)}
                                                        bg="bg-green-600"
                                                        image="/cSupply-bg.png"
                                                    />
                                                    <DataCard
                                                        title="Total Burnt"
                                                        value={formatWholeNumber(tokenData.totalburnt)}
                                                        bg="bg-white text-black"
                                                        image="/burn-bg.png"
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </>
                                )}

                                {activeTab === "burns" && (
                                    <section className="mt-8 flex flex-col">
                                        <div className="flex-1">
                                            <div className="bg-neutral-900 border-2 border-neutral-600 p-4 rounded-lg shadow-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h1 className="text-white">{getIntervalDisplayName()} Burns</h1>
                                                    <select
                                                        value={selectedBurnInterval}
                                                        onChange={handleIntervalChange}
                                                        className="bg-neutral-800 text-white border border-neutral-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    >
                                                        {BURN_INTERVALS.map((interval) => (
                                                            <option key={interval.value} value={interval.value}>
                                                                {interval.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <h1 className="text-3xl font-bold text-red-500">
                                                    {getSelectedBurnValue() === "No burns atm"
                                                        ? "No burns atm"
                                                        : formatWholeNumber(getSelectedBurnValue())}
                                                </h1>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Last updated: {new Date().toLocaleTimeString()}
                                                </p>
                                            </div>

                                            <div className="my-8 space-y-4">

                                            </div>
                                        </div>
                                        {tokenName && chain && <BurnsDisplay tokenName={tokenName} chain={chain} />}
                                    </section>
                                )}

                                {activeTab === "chart" && (
                                    <div className="flex items-center justify-center mt-8 h-64">
                                        <p className="text-gray-500">Chart content will be available soon.</p>
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:block">
                                <section className="md:grid md:grid-cols-2 md:gap-8 mb-16">
                                    <div>
                                        <div className="flex flex-row items-center gap-2 bg-black rounded-md p-4 mb-4">
                                            <img
                                                src={`/api/${chain}/logo/${tokenName}`}
                                                alt={`${tokenName?.toUpperCase()} Logo`}
                                                className="w-18 h-18 mb-2 rounded-md object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/file.svg';
                                                    (e.target as HTMLImageElement).alt = 'Default Logo';
                                                }}
                                            />
                                            <h1 className="text-2xl font-bold">{tokenName ? TOKEN_FULL_NAMES[tokenName.toLowerCase()] || tokenName.toUpperCase() : "Unknown Token"}</h1>
                                        </div>
                                        <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                            <h1>Price:</h1>
                                            <h1 className="font-medium text-xl">
                                                ${" "}
                                                {(() => {
                                                    const { display, isExponential } = formatPrice(tokenData.price);
                                                    if (!isExponential) return display;
                                                    const [prefix, exponent, value] = display.split(" ");
                                                    return (
                                                        <>
                                                            {prefix}
                                                            <sup className={styles.superscript}>{exponent}</sup> {value}
                                                        </>
                                                    );
                                                })()}
                                            </h1>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>MarketCap:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.marketCap)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Liquidity:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.liquidity)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Volume:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.volume)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Holders:</h1>
                                                <h1 className="font-medium text-xl">{formatWholeNumber(tokenData.holders)}</h1>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-row justify-center items-center gap-4 border-2 border-orange-500 rounded-md p-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-400">1h</span>
                                                <span
                                                    className={`px-2 py-1 rounded ${String(tokenData.priceChange1h).startsWith("-") ? "text-red-400" : "text-green-400"}`}
                                                >
                                                    {tokenData.priceChange1h}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-400">3h</span>
                                                <span
                                                    className={`px-2 py-1 rounded ${String(tokenData.priceChange3h).startsWith("-") ? "text-red-500" : "text-green-500"}`}
                                                >
                                                    {tokenData.priceChange3h}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-400">6h</span>
                                                <span
                                                    className={`px-2 py-1 rounded ${String(tokenData.priceChange6h).startsWith("-") ? "text-red-600" : "text-green-600"}`}
                                                >
                                                    {tokenData.priceChange6h}%
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-400">24h</span>
                                                <span
                                                    className={`px-2 py-1 rounded ${String(tokenData.priceChange24h).startsWith("-") ? "text-red-700" : "text-green-700"}`}
                                                >
                                                    {tokenData.priceChange24h}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <DataCard
                                                title="Total Supply"
                                                value={formatWholeNumber(tokenData.totalSupply)}
                                                bg="bg-white text-black"
                                                image="/tSupply.png"
                                            />
                                            <DataCard
                                                title="Total Locked"
                                                value={formatWholeNumber(tokenData.lSupply)}
                                                bg="bg-blue-600"
                                                image="/lock-bg.png"
                                            />
                                            <DataCard
                                                title="Circulatory Supply"
                                                value={formatWholeNumber(tokenData.cSupply)}
                                                bg="bg-green-600"
                                                image="/cSupply-bg.png"
                                            />
                                            <DataCard
                                                title="Total Burnt"
                                                value={formatWholeNumber(tokenData.totalburnt)}
                                                bg="bg-white text-black"
                                                image="/burn-bg.png"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="bg-neutral-900 border-2 border-neutral-600 p-4 rounded-lg shadow-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h1 className="text-white">{getIntervalDisplayName()} Burns</h1>
                                                <select
                                                    value={selectedBurnInterval}
                                                    onChange={handleIntervalChange}
                                                    className="bg-neutral-800 text-white border border-neutral-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                >
                                                    {BURN_INTERVALS.map((interval) => (
                                                        <option key={interval.value} value={interval.value}>
                                                            {interval.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <h1 className="text-3xl font-bold text-red-500">
                                                {getSelectedBurnValue() === "No burns atm"
                                                    ? "No burns atm"
                                                    : formatWholeNumber(getSelectedBurnValue())}
                                            </h1>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Last updated: {new Date().toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <div className="mt-8 space-y-4">

                                        </div>

                                        <div className="mt-8">
                                            {tokenName && chain && <BurnsDisplay tokenName={tokenName} chain={chain} />}
                                        </div>
                                    </div>
                                </section>

                                <div className="flex items-center justify-center mt-8 h-64 mb-16">
                                    <p className="text-gray-500">Chart content will be available soon.</p>
                                </div>
                            </div>
                        </>
                    )
                )}
            </main>
            <div className="md:hidden">
                <Footer onTabChange={setActiveTab} activeTab={activeTab} />
            </div>
        </div>
    );
}
