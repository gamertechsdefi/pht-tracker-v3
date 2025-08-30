import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/");
  const tokenName = parts[parts.length - 1].toLowerCase();

  const tokenPoolMapping: Record<string, string> = {
    pht: "0x8a2328b2c8e6a6f56668a0e26081efc250a8d6c0",
    wkc: "0x933477eba23726ca95a957cb85dbb1957267ef85",
    war: "0xf1c2d7d7e539a02acc3f0c46ca1e83c0f69baac2",
    dtg: "0xd2e4a524d1a932adbc70fb41f2bec05884d5f6c2",
    yukan: "0x0797395fcad3f27059405f266080701a77688c7f",
    btcdragon: "0x59670d4ac4862b5b9c495ca31a2a4bc6fd1d0101",
    ocicat: "0x1df65d3a75aecd000a9c17c97e99993af01dbcd1",
    nene: "0x9697815e4581cdf320cbc4aac212dc92a1ac2992",
    twc: "0x955ed3d0e1d2615a1d7bebb10ffab37f150bbb21",
    durt: "0xdc98307571709e048f8c6d1ff0bb48eab054e535",
    gtan: "0xe965e86bc7da68fd489c4ab438eb81a48a4ad6e5",
    zedek: "0x246d1711a3834c405845ae52de0b808ef9bfba6e",
    tkc: "0xbee567474f87f7725791f2872d165fb69e0bbcdd",
    twd: "0x4f61c7672d36da605cef5e52f6f2896193b61e83",
    bcat: "0x91e5de867f67cf90d3f658b22aff4e8c881d4d2a",
    nct: "0xa52c143c9f5e410497e671ec9ad40b868835e9bb",
    kitsune: "0x969d92e917e68a3a4e8596770852d94bd315d194",
    bengcat: "0x07acf7676d34adf7c217c89a1efbf8379c00cea6",
    crystalstones: "0xe252fcb1aa2e0876e9b5f3ed1e15b9b4d11a0b00",
    bft: "0x99c2d5977b94bdfdf91ee36f613e330e8102e326",
    cross: "0x3e93fec6e3ae5940dac4869acf5178bd30f4fc04",
    thc: "0x62be1533f3a78de99ca297ebbe489a3fb7253bef",
    bbft: "0xfB69e2d3d673A8DB9Fa74ffc036A8Cf641255769",
    bob: "0x51363F073b1E4920fdA7AA9E9d84BA97EdE1560e",
    puffcat: "0x14a8d0AC8Fc456899F2DD33C3f4E32403A78126c",
    crepe: "0xeb2B7d5691878627eff20492cA7c9a71228d931D",
    popielno: "0xdc3d92dd5a468edb7a7772452700cc93bb1826ad",
    spray: "0x6C0D4adAc8fb85CC336C669C08b44f2e1d492575",
    mbc: "0x170f044f9c7a41ff83caccad6ccca1b941d75af7",
    mars: "0x6844b2e9afb002d188a072a3ef0fbb068650f214",
    sdc: "0x8cDC41236C567511f84C12Da10805cF50Dcdc27b",
  };

  const poolAddress =
    tokenPoolMapping[tokenName] || tokenPoolMapping["pht"];

  const iframeHtml = `<iframe height="100%" width="100%" id="geckoterminal-embed" title="GeckoTerminal Embed" src="https://www.geckoterminal.com/bsc/pools/${poolAddress}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=15m" frameborder="0" allow="clipboard-write" allowfullscreen></iframe>`;

  return new NextResponse(iframeHtml, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
