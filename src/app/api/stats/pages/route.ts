
import { corsResponse } from "../../utils/cors";

export async function OPTIONS() {
  return corsResponse(null, 204);
}

export async function GET() {
  // The Stats API expects the site hostname only (no protocol). Example:
  // https://simpleanalytics.com/<site>.json?version=5&fields=pages
  const rawDomain =
    process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS_DOMAIN || "tracker.phoenixtoken.community";
  const site = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const apiKey = process.env.SIMPLE_ANALYTICS_API_KEY;
  const userId = "sa_user_id_2162b862-5dea-4aa1-8101-6c969fc8583b"; // Replace if different

    if (!apiKey) {
    return corsResponse(
      { message: "Simple Analytics API key is not set" },
      500
    );
  }  try {
    // Use the Stats API (v5) with only pages field
    const requestUrl = `https://simpleanalytics.com/${site}.json?version=5&fields=pages`;
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
      console.error("Simple Analytics Pages API error:", errorText);
      return corsResponse(
        {
          message: "Error fetching pages data",
          site,
          requestUrl,
          status: response.status,
          body: errorText,
        },
        response.status
      );
    }

    const data = await response.json();

    // Normalize pages response to match frontend expectations
    const pages = Array.isArray(data?.pages)
      ? data.pages.map((p: any) => ({
          page: p?.page ?? p?.value ?? "",
          pageviews: p?.pageviews ?? 0,
        }))
      : [];

    const result = {
      pages: pages,
    };

    return corsResponse(result, 200);
  } catch (error) {
    console.error("Error fetching pages:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsResponse(
      { 
        message: "Internal Server Error", 
        error: message, 
        site, 
        requestUrl: `https://simpleanalytics.com/${site}.json?version=5&fields=pages` 
      },
      500
    );
  }
}
