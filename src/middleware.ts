import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokensBySymbol, isValidContractAddress } from './lib/tokenRegistry';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a token page route pattern: /[chain]/[identifier]
  const tokenPageMatch = pathname.match(/^\/([^\/]+)\/([^\/]+)$/);

  if (tokenPageMatch) {
    const [, chain, identifier] = tokenPageMatch;

    // ALWAYS allow direct contract address access - no redirects needed
    if (isValidContractAddress(identifier, chain as 'bsc' | 'sol' | 'rwa')) {
      return NextResponse.next();
    }

    // Only handle symbol-based redirects for backward compatibility
    // Check if it's a token symbol that needs to be redirected to contract address
    const tokensWithSymbol = getTokensBySymbol(identifier);
    const chainTokens = tokensWithSymbol.filter(token => token.chain === chain);

    if (chainTokens.length === 1) {
      // Only one token with this symbol on this chain - redirect to contract address
      const tokenMetadata = chainTokens[0];
      const newUrl = new URL(`/${chain}/${tokenMetadata.address}`, request.url);
      return NextResponse.redirect(newUrl, 301); // Permanent redirect
    } else if (chainTokens.length > 1) {
      // Multiple tokens with same symbol on same chain - redirect to error page with options
      const newUrl = new URL(`/error?type=duplicate_symbol&identifier=${encodeURIComponent(identifier)}&chain=${chain}`, request.url);
      return NextResponse.redirect(newUrl, 302); // Temporary redirect
    }

    // If no token found with this symbol, let Next.js handle the 404
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
