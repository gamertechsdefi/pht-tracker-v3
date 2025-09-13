import type { Metadata } from "next";
import {  Nunito } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// const spaceGrotesk = Space_Grotesk({
//   variable: "--font-space-grotesk",
//   subsets: ["latin"],
//   display: "swap", 
// });

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "500", "700"],
});

export const metadata: Metadata = {
  title: "FireScreener",
  description: "Built by a meme, powered by purpose. Track tokens burns, charts trends, and unlock AI insights, all in one blazing dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <body
        className={`${nunito.variable} antialiased`}
      >
        {children}
      </body>
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      <Script data-goatcounter="https://firescreener.goatcounter.com/count"
        async src="//gc.zgo.at/count.js" />
      
      <Analytics />
    </html>
  );
}
