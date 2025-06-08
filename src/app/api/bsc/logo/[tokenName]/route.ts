import { NextResponse } from "next/server";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export async function GET(
  request: Request,
  { params }: { params: { tokenName: string } }
) {
  const tokenName = params.tokenName.toLowerCase();
  const fileExtensions = [".png", ".jpg", ".jpeg", ".webp"];
  let filePath: string | null = null;

  // Check for file with any of the supported extensions
  for (const ext of fileExtensions) {
    const potentialPath = join(process.cwd(), "public", "images", "bsc", "token-logos", `${tokenName}${ext}`);
    if (existsSync(potentialPath)) {
      filePath = potentialPath;
      break;
    }
  }

  // If no file is found, return a 404 response
  if (!filePath) {
    return NextResponse.json({ error: "Logo not found for this token" }, { status: 404 });
  }

  // Read the file and determine its content type
  const fileBuffer = readFileSync(filePath);
  const contentType = filePath.endsWith(".png") ? "image/png" :
                      filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg" :
                      filePath.endsWith(".webp") ? "image/webp" : "application/octet-stream";

  // Return the image as a response
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
