import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { tokenName: string } }) {
  const iframeHtml = `<iframe height="100%" width="100%" id="geckoterminal-embed" title="GeckoTerminal Embed" src="https://www.geckoterminal.com/bsc/pools/0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=15m" frameborder="0" allow="clipboard-write" allowfullscreen></iframe>`;
  
  return new NextResponse(iframeHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
