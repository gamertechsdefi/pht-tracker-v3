import { useState, useEffect, useCallback } from 'react';

// Define types for token data
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

interface SocialLinks {
    website: string;
    twitter: string;
    telegram: string;
    bscscan: string;
}

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
};

export function useTokenData(chain: string | null, tokenName: string | null) {
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTokenData = useCallback(async () => {
        if (!chain || !tokenName) {
            setError("Invalid chain or token name");
            setLoading(false);
            return;
        }

        const token = tokenName.toLowerCase();
        const chainLower = chain.toLowerCase();

        const expectedChain = TOKEN_LIST[token];
        if (!expectedChain || expectedChain !== chainLower) {
            setError(`Token "${token}" not found or chain mismatch`);
            setLoading(false);
            return;
        }

        try {
            const apiEndpoints = [
                `/api/${chainLower}/token-metrics/${token}`,
                `/api/${chainLower}/token-holders/${token}`,
                `/api/${chainLower}/token-price/${token}`,
                `/api/${chainLower}/total-burnt/${token}`,
                `/api/${chainLower}/token-profile/${token}`,
                `/api/${chainLower}/socials/${token}`,
                `/api/${chainLower}/ca/${token}`,
            ];

            const responses = await Promise.all(
                apiEndpoints.map((endpoint) =>
                    fetch(endpoint)
                        .then((res) => (res.ok ? res.json() : null))
                        .catch(() => null)
                )
            );

            const [metricsData, holdersData, priceData, burnsData, profileData, socialData, contractData] = responses;

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
                contract: contractData?.address || "Not found",
            });
            setSocialLinks(socialData || null);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch token data";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [chain, tokenName]);

    useEffect(() => {
        let isMounted = true;
        const poll = async () => {
            await fetchTokenData();
            if (isMounted) {
                setTimeout(poll, 5000);
            }
        };

        poll();

        return () => {
            isMounted = false;
        };
    }, [fetchTokenData]);

    return { tokenData, socialLinks, loading, error };
}
