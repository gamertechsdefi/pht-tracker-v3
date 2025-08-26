
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get("user-agent");

    const response = await fetch("https://queue.simpleanalyticscdn.com/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent || "ServerSide/1.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Simple Analytics API error:", errorText);
      return NextResponse.json({ message: "Error sending event to Simple Analytics" }, { status: response.status });
    }

    return NextResponse.json({ message: "Event sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
