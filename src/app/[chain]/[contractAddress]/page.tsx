"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import DataCard from "@/components/DataCard";
import BurnsDisplay from "@/components/BurnHistory";
import BurnIntervals from "@/components/BurnIntervals";
import { FaCopy, FaGlobe, FaTelegramPlane } from "react-icons/fa";
import { SiX } from "react-icons/si";
import styles from '../styles.module.css';
import Footer from "@/components/Footer";
import Image from "next/image";
import CurrencyConverter from "@/components/Converter";
import { getTokenByAddress, isValidContractAddress } from "@/lib/tokenRegistry";

// Define types for token data and intervals
interface TokenData {
    price: string | number;
    totalSupply: string | number;
    cSupply: string | number;
    lSupply: string | number;
    holders: string | number;
    marketCap: string | number;
    fdv: string | number;
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
    contract: string;
}

// Define props interface
interface TokenPageProps {
    params: Promise<{ chain: string; contractAddress: string }>;
}

export default function TokenPage({ params: paramsPromise }: TokenPageProps) {
    const router = useRouter();
    const [chain, setChain] = useState<string | null>(null);
    const [contractAddress, setContractAddress] = useState<string | null>(null);
    const [tokenMetadata, setTokenMetadata] = useState<any>(null);

    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [socialLinks, setSocialLinks] = useState<{ website: string; twitter: string; telegram: string; bscscan: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("info");

    useEffect(() => {
        if (paramsPromise) {
            Promise.resolve(paramsPromise).then((resolvedParams) => {
                const { chain: paramChain, contractAddress: paramContractAddress } = resolvedParams || {};
                setChain(paramChain);
                setContractAddress(paramContractAddress);
            });
        }
    }, [paramsPromise]);

    useEffect(() => {
        async function fetchTokenData() {
            console.log("Params received:", { chain, contractAddress });

            if (!chain || !contractAddress) {
                console.log("Missing chain or contractAddress:", { chain, contractAddress });
                setError("Invalid chain or contract address");
                setLoading(false);
                return;
            }

            const chainLower = chain.toLowerCase() as 'bsc' | 'sol';
            
            // Validate contract address format
            if (!isValidContractAddress(contractAddress, chainLower)) {
                console.log(`Invalid contract address format: ${contractAddress} for chain: ${chainLower}`);
                router.push(`/error?type=invalid_address&identifier=${encodeURIComponent(contractAddress)}&chain=${chainLower}`);
                return;
            }

            // Get token metadata from registry
            const metadata = getTokenByAddress(contractAddress);
            if (!metadata) {
                console.log(`Token not found in registry: ${contractAddress}`);
                router.push(`/error?type=token_not_found&identifier=${encodeURIComponent(contractAddress)}&chain=${chainLower}`);
                return;
            }

            // Verify chain matches
            if (metadata.chain !== chainLower) {
                console.log(`Chain mismatch: expected "${metadata.chain}", got "${chainLower}"`);
                router.push(`/error?type=chain_mismatch&identifier=${encodeURIComponent(contractAddress)}&chain=${chainLower}`);
                return;
            }

            setTokenMetadata(metadata);
            console.log("Validation passed, fetching data for:", { chain: chainLower, contractAddress, symbol: metadata.symbol });

            try {
                // Use the token symbol for API calls (for backward compatibility with existing APIs)
                // const tokenSymbol = metadata.symbol;
                const apiEndpoints = [
                    `/api/${chainLower}/token-metrics/${contractAddress}`,
                    `/api/${chainLower}/token-holders/${contractAddress}`,
                    `/api/${chainLower}/token-price/${contractAddress}`, // Now using contract address
                    `/api/${chainLower}/total-burnt/${contractAddress}`,
                    `/api/${chainLower}/token-profile/${contractAddress}`,
                    `/api/${chainLower}/socials/${contractAddress}`,
                    `/api/${chainLower}/ca/${contractAddress}`,
                ];
                console.log("API endpoints:", apiEndpoints);

                const responses = await Promise.all(
                    apiEndpoints.map((endpoint) =>
                        fetch(endpoint)
                            .then((res) => (res.ok ? res.json() : null))
                            .catch(() => null)
                    )
                );

                const [metricsData, holdersData, priceData, burnsData, profileData, socialData] = responses;

                setTokenData({
                    price: priceData?.price || "N/A",
                    totalSupply: metricsData?.totalSupply || "N/A",
                    cSupply: metricsData?.circulatingSupply || "N/A",
                    lSupply: metricsData?.lockedSupply || "N/A",
                    holders: holdersData?.totalHolders || "N/A",
                    marketCap: priceData?.marketCap || "N/A",
                    fdv: priceData?.fdv || "N/A",
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
                    contract: contractAddress,
                });
                setSocialLinks(socialData || null);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch token data";
                console.error("Error fetching token data:", errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        if (chain && contractAddress) {
            fetchTokenData();
        }
    }, [chain, contractAddress, router]);

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

    function formatEvmAddress(address: string, shorten: boolean = true, chars: number = 5): string {
        // Normalize to lowercase and remove '0x' prefix if present
        const normalized = address.toLowerCase().replace(/^0x/i, '');
        if (normalized.length < 40 ) {
            throw new Error("Invalid EVM address. Must be 40 hexadecimal characters.");
        }

        // Basic checksum: alternate case for readability (not full EIP-55, which requires Keccak-256)
        let checksum = '0x';
        for (let i = 0; i < normalized.length; i++) {
            // Simple rule: uppercase every even-indexed character (0-based)
            checksum += i % 2 === 0 ? normalized[i].toUpperCase() : normalized[i];
        }

        // Shorten if requested
        if (shorten) {
            if (chars < 1) throw new Error("Number of characters must be at least 1.");
            return checksum.slice(0, 2 + chars) + '...' + checksum.slice(-chars);
        }

        return checksum;
    }

    // Function to copy the token address to the clipboard
    async function copyAddress(address: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(address);
            console.log('Address copied to clipboard:', address);
            alert('Address copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy address:', error);
            alert('Failed to copy address. Please try again.');
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 px-3 md:px-8 mt-8">

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
                                Loading data for {tokenMetadata?.symbol?.toUpperCase() || "token"}...
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
                    tokenData && tokenMetadata && (
                        <>
                            <div className="md:hidden">
                                {/* Info Tab */}
                                <div className={activeTab === "info" ? "" : "hidden"}>
                                    <section className="">
                                        <div className="flex flex-row bg-black rounded-lg p-4 mb-2 justify-between md:items-end w-full">
                                            <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
                                                <img
                                                    src={`/api/${chain}/logo/${contractAddress}`}
                                                    alt={`${tokenMetadata.symbol.toUpperCase()} Logo`}
                                                    className="w-15 h-15 rounded-md object-contain flex-shrink-0"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/file.svg';
                                                        (e.target as HTMLImageElement).alt = 'Default Logo';
                                                    }}
                                                />
                                                <h1 className="text-lg md:text-2xl font-bold break-words">{tokenMetadata.name}</h1>
                                            </div>
                                            {socialLinks && (
                                                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                                                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <FaGlobe className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <SiX className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <FaTelegramPlane className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.bscscan} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <Image src="/bscscan.png" alt="BscScan Logo" width={10} height={10} className="h-6 w-6" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                            <h1>Price:</h1>
                                            <h1 className="font-medium text-lg md:text-xl">
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
                                                <h1>Market Cap:</h1>
                                                <h1 className="font-medium text-lg md:text-xl">${formatLargeNumber(tokenData.marketCap)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>FDV:</h1>
                                                <h1 className="font-medium text-lg md:text-xl">${formatLargeNumber(tokenData.fdv)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Liquidity:</h1>
                                                <h1 className="font-medium text-lg md:text-xl">${formatLargeNumber(tokenData.liquidity)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Volume:</h1>
                                                <h1 className="font-medium text-lg md:text-xl">${formatLargeNumber(tokenData.volume)}</h1>
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

                                        <div className="flex flex-col gap-2 bg-neutral-900 border-2 border-neutral-600 p-4 mt-4 rounded-xl">
                                            <p className="text-md">Contract Address</p>
                                            <h1 className="text-lg md:text-xl font-bold text-orange-500 flex gap-2">
                                                <span>{formatEvmAddress(tokenData.contract)}</span>
                                                <button onClick={()=> copyAddress(tokenData.contract)}><FaCopy size={20} fill="#ffffff" /></button>
                                            </h1>
                                        </div>

                                        {tokenData.contract && (
                                            <CurrencyConverter
                                                tokenSymbol={tokenMetadata.symbol.toUpperCase()}
                                                tokenAddress={tokenData.contract}
                                                tokenLogoUrl={tokenData.profile}
                                            />
                                        )}
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
                                </div>

                                {/* Burns Tab */}
                                <div className={activeTab === "burns" ? "" : "hidden"}>
                                    <section className="mt-8 flex flex-col">
                                        <div className="flex-1">
                                            {tokenMetadata && <BurnIntervals tokenName={tokenMetadata.symbol} />}
                                        </div>
                                        {tokenMetadata && chain && <BurnsDisplay tokenName={tokenMetadata.symbol} chain={chain} />}
                                    </section>
                                </div>

                                {activeTab === "chart" && (
                                    <div className="h-[48rem] mb-16 -mx-6">
                                        <iframe
                                            height="100%"
                                            width="100%"
                                            id="geckoterminal-embed"
                                            title="GeckoTerminal Embed"
                                            src={`/api/${chain}/chart/${contractAddress}`}
                                            frameBorder="0"
                                            allow="clipboard-write"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:block">
                                <section className="md:grid md:grid-cols-2 md:gap-8 mb-16">
                                    <div>
                                        <div className="flex flex-row items-center gap-2 bg-black rounded-md p-4 mb-4">
                                            <img
                                                src={`/api/${chain}/logo/${contractAddress}`}
                                                alt={`${tokenMetadata.symbol.toUpperCase()} Logo`}
                                                className="w-18 h-18 rounded-md object-contain flex-shrink-0"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/file.svg';
                                                    (e.target as HTMLImageElement).alt = 'Default Logo';
                                                }}
                                            />
                                            <h1 className="text-2xl font-bold break-words">{tokenMetadata.name}</h1>
                                            {socialLinks && (
                                                <div className="flex flex-row gap-4 mt-2 w-full">
                                                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <FaGlobe className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <SiX className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <FaTelegramPlane className="h-6 w-6" />
                                                    </a>
                                                    <a href={socialLinks.bscscan} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                                        <Image src="/bscscan.png" alt="BscScan Logo" width={10} height={10} className="h-6 w-6" />
                                                    </a>
                                                </div>
                                            )}
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
                                                <h1>Market Cap:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.marketCap)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>FDV:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.fdv)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Liquidity:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.liquidity)}</h1>
                                            </div>
                                            <div className="flex flex-col items-center border-2 border-orange-500 rounded-md p-4">
                                                <h1>Volume:</h1>
                                                <h1 className="font-medium text-xl">${formatLargeNumber(tokenData.volume)}</h1>
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

                                        <div className="flex flex-col gap-2 bg-neutral-900 border-2 border-neutral-600 p-4 mt-4 rounded-xl">
                                            <p className="text-md">Contract Address</p>
                                            <h1 className="text-lg md:text-2xl font-bold text-orange-500 flex gap-2">
                                                <span>{tokenData.contract}</span>
                                                <button onClick={()=> copyAddress(tokenData.contract)}><FaCopy size={20} fill="#ffffff" /></button>
                                            </h1>
                                        </div>

                                        {tokenData.contract && tokenMetadata && (
                                            <CurrencyConverter
                                                tokenSymbol={tokenMetadata.symbol.toUpperCase()}
                                                tokenAddress={tokenData.contract}
                                                tokenLogoUrl={tokenData.profile}
                                            />
                                        )}

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
                                        <div className=" p-4 rounded-lg shadow-lg">
                                            {tokenMetadata && <BurnIntervals tokenName={tokenMetadata.symbol} />}
                                        </div>

                                        <div className="mt-8 space-y-4">
                                        </div>

                                        <div className="mt-8">
                                            {tokenMetadata && chain && <BurnsDisplay tokenName={tokenMetadata.symbol} chain={chain} />}
                                        </div>
                                    </div>
                                </section>

                                <div className="mt-8 h-[36rem] mb-16 -mx-8">
                                    <iframe
                                        height="100%"
                                        width="100%"
                                        id="geckoterminal-embed"
                                        title="GeckoTerminal Embed"
                                        src={`/api/${chain}/chart/${contractAddress}`}
                                        frameBorder="0"
                                        allow="clipboard-write"
                                        allowFullScreen
                                    ></iframe>
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
