import { NextResponse } from "next/server";
import { headers } from "next/headers";

const allowedOrigins = [
  'http://smcstats.com',
  'https://smcstats.com',
  'https://5.smcstats.com',
  'http://localhost:3000',
  'https://phoenixtoken.community',
  'https://tracker.phoenixtoken.community',
  'https://firescreener.com'
];

export function corsHeaders(requestOrigin?: string) {
  // Get the origin from the request or use the first allowed origin as default
  const origin = requestOrigin || allowedOrigins[0];
  
  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Api-Key, User-Id",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export async function corsResponse(data: any, status: number = 200) {
  const headersList = await headers();
  const origin = headersList.get("origin");
  
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(origin || undefined),
  });
}
