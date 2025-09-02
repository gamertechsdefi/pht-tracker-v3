import { NextResponse } from "next/server";
// import { headers } from "next/headers";

export function corsHeaders(origin: string = "http://smcstats.com/") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Api-Key, User-Id",
    "Access-Control-Max-Age": "86400",
  };
}

export function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(),
  });
}
