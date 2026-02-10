import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
// import Script from "next/script";

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
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="23de30be-d6d1-4152-b10c-7442a99240ce"></script>
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "9ad13f4d-03af-4407-b965-fe9378f378cd",
              safari_web_id: "web.onesignal.auto.48d27e8c-5bf0-4f8f-a083-e09c208eb2cb",
              notifyButton: {
                enable: true,
              },
            });
          });
        `}} />
      </head>

      <body
        className={`${nunito.variable} antialiased`}
      >
        {children}
      </body>
      {/* <script defer src="https://cloud.umami.is/script.js" data-website-id="23de30be-d6d1-4152-b10c-7442a99240ce"></script> */}
      <Analytics />
    </html>
  );
}
