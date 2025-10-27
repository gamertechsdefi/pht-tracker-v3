import { corsResponse } from "../../utils/cors";

export async function OPTIONS() {
  return corsResponse(null, 204);
}

export async function GET() {
  // Umami API setup
  const umamiApiUrl = process.env.NEXT_PUBLIC_UMAMI_API_URL || "https://cloud.umami.is/analytics/us"; // e.g., https://analytics.umami.is or self-hosted URL
  const websiteId = process.env.UMAMI_WEBSITE_ID; // Umami website ID
  const authToken = "api_OqbRx6x5afmJpL8RI4E2r2Q4MWJsUmzt"; // Umami API token

  if (!authToken || !websiteId || !umamiApiUrl) {
    return corsResponse(
      {
        message: "Umami configuration is incomplete (missing API token, website ID, or API URL)",
      },
      500
    );
  }

  try {
    // Umami API endpoint for page views
    const requestUrl = `${umamiApiUrl}/api//me/websites/${websiteId}/metrics?type=url`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Umami API error:", errorText);
      return corsResponse(
        {
          message: "Error fetching pages data",
          websiteId,
          requestUrl,
          status: response.status,
          body: errorText,
        },
        response.status
      );
    }

    const data = await response.json();

    // Normalize Umami response to match frontend expectations
    const pages = Array.isArray(data)
      ? data.map((p) => ({
          page: p?.x ?? "", // Umami uses 'x' for the page URL in metrics
          pageviews: p?.y ?? 0, // Umami uses 'y' for the count (pageviews)
        }))
      : [];

    const result = {
      pages,
    };

    return corsResponse(result, 200);
  } catch (error) {
    console.error("Error fetching pages from Umami:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsResponse(
      {
        message: "Internal Server Error",
        error: message,
        websiteId,
        requestUrl: `${umamiApiUrl}/api/websites/${websiteId}/metrics?type=url`,
      },
      500
    );
  }
}