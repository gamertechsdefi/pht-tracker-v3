declare module '@goplus/sdk-node' {
    export const GoPlus: {
        tokenSecurity: (chainId: string, addresses: string[]) => Promise<any>;
        solanaTokenSecurity: (addresses: string[]) => Promise<any>;
        supportedChains: () => Promise<any>;
        API_NAMES: any;
        // Add other methods if needed
    };
}
