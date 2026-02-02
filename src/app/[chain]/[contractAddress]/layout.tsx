import type { Metadata } from "next";
import { getTokenByAddress, getTokenBySymbol } from "@/lib/tokenRegistry";

type Props = {
  params: Promise<{
    chain: string;
    contractAddress: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, contractAddress } = await params;
  
  // Try to get token by address first, then by symbol
  let token = getTokenByAddress(contractAddress);
  
  // If not found by address, try by symbol with chain filter
  if (!token) {
    token = getTokenBySymbol(contractAddress, chain as 'bsc' | 'sol' | 'rwa');
  }
  
  // Default metadata if token not found
  if (!token) {
    return {
      title: `${contractAddress} | FireScreener`,
      description: `Check out ${contractAddress} on FireScreener`,
    };
  }
  
  return {
    title: `${token.symbol} | ${token.name}`,
    description: `Check out ${token.symbol} on FireScreener`,
  };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
