import { NextResponse } from "next/server";

export async function GET() {
  console.log("--- Pageviews API Route Handler ---");

  const rawDomain =
    process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_DOMAIN || "tracker.phoenixtoken.community";
  const site = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const apiKey = process.env.SIMPLE_ANALYTICS_API_KEY;
  const userId = "sa_user_id_2162b862-5dea-4aa1-8101-6c969fc8583b"; // Replace if different

  console.log("NEXT_PUBLIC_SIMPLE_ANALYTICS_DOMAIN:", process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_DOMAIN);
  console.log("SIMPLE_ANALYTICS_API_KEY:", apiKey ? "Set" : "Not Set");

  if (!apiKey) {
    console.error("Simple Analytics API key is not set");
    return NextResponse.json(
      { message: "Simple Analytics API key is not set" },
      { status: 500 }
    );
  }

  const requestUrl = `https://simpleanalytics.com/${site}.json?version=5&fields=pageviews`;
  console.log("Request URL:", requestUrl);

  try {
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

    console.log("Simple Analytics API Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Simple Analytics Pageviews API error:", errorText);
      return NextResponse.json(
        {
          message: "Error fetching pageviews data",
          site,
          requestUrl,
          status: response.status,
          body: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Simple Analytics API Response Data:", data);

    const pageviews = data?.pageviews ?? 0;
    const result = { pageviews };

    console.log("Final Response to Frontend:", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching pageviews:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        message: "Internal Server Error", 
        error: message, 
        site, 
        requestUrl 
      },
      { status: 500 }
    );
  }
}