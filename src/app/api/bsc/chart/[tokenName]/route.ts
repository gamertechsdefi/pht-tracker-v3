import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { tokenName: string } }) {
  // Mapping of token names to GeckoTerminal pool addresses
  // Note: These are placeholder addresses. Replace with actual pool addresses for each token.
  const tokenPoolMapping: Record<string, string> = {
    pht: "0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0", // Current hardcoded address as placeholder
    wkc: "0x933477eba23726ca95a957cb85dbb1957267ef85", // Placeholder, replace with actual
    war: "0xf1c2d7d7e539a02acc3f0c46ca1e83c0f69baac2", // Placeholder, replace with actual
    dtg: "0xd2e4a524d1a932adbc70fb41f2bec05884d5f6c2", // Placeholder, replace with actual
    yukan: "0x0797395fcad3f27059405f266080701a77688c7f", // Placeholder, replace with actual
    btcdragon: "0x59670d4ac4862b5b9c495ca31a2a4bc6fd1d0101", // Placeholder, replace with actual
    ocicat: "0x1df65d3a75aecd000a9c17c97e99993af01dbcd1", // Placeholder, replace with actual
    nene: "0x9697815e4581cdf320cbc4aac212dc92a1ac2992", // Placeholder, replace with actual
    twc: "0x955ed3d0e1d2615a1d7bebb10ffab37f150bbb21", // Placeholder, replace with actual
    durt: "0xdc98307571709e048f8c6d1ff0bb48eab054e535", // Placeholder, replace with actual
    gtan: "0xe965e86bc7da68fd489c4ab438eb81a48a4ad6e5", // Placeholder, replace with actual
    zedek: "0x246d1711a3834c405845ae52de0b808ef9bfba6e", // Placeholder, replace with actual
    tkc: "0xbee567474f87f7725791f2872d165fb69e0bbcdd", // Placeholder, replace with actual
    twd: "0x4f61c7672d36da605cef5e52f6f2896193b61e83", // Placeholder, replace with actual
    bcat: "0x91e5de867f67cf90d3f658b22aff4e8c881d4d2a", // Placeholder, replace with actual
    nct: "0xa52c143c9f5e410497e671ec9ad40b868835e9bb", // Placeholder, replace with actual
    kitsune: "0x969d92e917e68a3a4e8596770852d94bd315d194", // Placeholder, replace with actual
    bengcat: "0x07acf7676d34adf7c217c89a1efbf8379c00cea6", // Placeholder, replace with actual
    crystalstones: "0xe252fcb1aa2e0876e9b5f3ed1e15b9b4d11a0b00", // Placeholder, replace with actual
    bft: "0x99c2d5977b94bdfdf91ee36f613e330e8102e326", // Placeholder, replace with actual
    cross: "0x3e93fec6e3ae5940dac4869acf5178bd30f4fc04", // Placeholder, replace with actual
    thc: "0x62be1533f3a78de99ca297ebbe489a3fb7253bef" // Placeholder, replace with actual
  };

  const tokenName = params.tokenName.toLowerCase();
  const poolAddress = tokenPoolMapping[tokenName] || "0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0"; // Default to the provided address if token not found
  
  const iframeHtml = `<iframe height="100%" width="100%" id="geckoterminal-embed" title="GeckoTerminal Embed" src="https://www.geckoterminal.com/bsc/pools/${poolAddress}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=15m" frameborder="0" allow="clipboard-write" allowfullscreen></iframe>`;
  
  return new NextResponse(iframeHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
