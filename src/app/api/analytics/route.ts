// pages/api/analytics/stats.js
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // The Stats API expects the site hostname only (no protocol). Example:
  // https://simpleanalytics.com/<site>.json?version=5
  const rawDomain =
    process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_DOMAIN || "tracker.phoenixtoken.community";
  const site = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const apiKey = process.env.SIMPLE_ANALYTICS_API_KEY;
  const userId = "sa_user_id_2162b862-5dea-4aa1-8101-6c969fc8583b"; // Replace if different

  if (!apiKey) {
    return NextResponse.json(
      { message: "Simple Analytics API key is not set" },
      { status: 500 }
    );
  }

  try {
    // Use the Stats API (v5) as per docs: https://docs.simpleanalytics.com/api/stats
    const requestUrl = `https://simpleanalytics.com/${site}.json?version=5&fields=pageviews,visitors,pages,referrers`;
    const response = await fetch(
      requestUrl,
      {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          "User-Id": userId,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Simple Analytics Stats API error:", errorText);
      return NextResponse.json(
        {
          message: "Error fetching analytics data",
          site,
          requestUrl,
          status: response.status,
          body: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize response to match frontend expectations
    const normalized = {
      pageviews: data?.pageviews ?? 0,
      visitors: data?.visitors ?? 0,
      pages: Array.isArray(data?.pages)
        ? data.pages.map((p: any) => ({
            page: p?.page ?? p?.value ?? "",
            pageviews: p?.pageviews ?? 0,
          }))
        : [],
      referrers: Array.isArray(data?.referrers)
        ? data.referrers.map((r: any) => ({
            referrer: r?.referrer ?? r?.value ?? "",
            pageviews: r?.pageviews ?? 0,
          }))
        : [],
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Internal Server Error", error: message, site, requestUrl: `https://simpleanalytics.com/${site}.json` },
      { status: 500 }
    );
  }
}