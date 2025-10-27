import { corsResponse } from "../../utils/cors";

export async function OPTIONS() {
  return corsResponse(null, 204);
}

export async function GET() {
  const umamiApiUrl = process.env.UMAMI_API_URL || "https://api.umami.is";
  const websiteId = "23de30be-d6d1-4152-b10c-7442a99240ce";
  const authToken = process.env.UMAMI_API_KEY;

  if (!authToken || !websiteId || !umamiApiUrl) {
    return corsResponse(
      { message: "Umami configuration is incomplete" },
      500
    );
  }

  const endAt = Date.now();
  const startAt = endAt - (30 * 24 * 60 * 60 * 1000); // Last 30 days

  // Use /stats endpoint to get total visitors
  const requestUrl = new URL(`${umamiApiUrl.replace(/\/+$/, "")}/v1/websites/${websiteId}/stats`);
  requestUrl.searchParams.append("startAt", startAt.toString());
  requestUrl.searchParams.append("endAt", endAt.toString());

  try {
    const response = await fetch(requestUrl.toString(), {
      method: "GET",
      headers: {
        "x-umami-api-key": authToken,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Umami Visitors API error:", errorText);
      return corsResponse(
        {
          message: "Error fetching visitors data",
          websiteId,
          requestUrl: requestUrl.toString(),
          status: response.status,
          body: errorText,
        },
        response.status
      );
    }

    const data = await response.json();

    // Umami /stats endpoint returns an object with { visitors: { value: number }, ... }
    const result = {
      visitors: data?.visitors?.value ?? 0,
    };

    return corsResponse(result, 200);
  } catch (error) {
    console.error("Error fetching visitors:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsResponse(
      {
        message: "Internal Server Error",
        error: message,
        websiteId,
        requestUrl: requestUrl.toString(),
      },
      500
    );
  }
}