import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { env } from "~/env";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> },
) {
  try {
    const { audioId } = await params;
    const session = await auth();

    // Get audio metadata from database
    const audio = await db.audio.findUnique({
      where: { id: audioId },
      select: {
        filePath: true,
        isPublic: true,
        createdById: true,
        originalFileName: true,
      },
    });

    if (!audio) {
      return new NextResponse("Audio not found", { status: 404 });
    }

    // Check access permissions
    const isCreator = session?.user?.id === audio.createdById;
    const hasAccess = audio.isPublic || isCreator;

    // If authentication is required for public content and user is not logged in
    if (env.REQUIRE_AUTH_FOR_PUBLIC_CONTENT && !session) {
      return new NextResponse("Authentication required", { status: 401 });
    }

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Construct file path from filename (filePath now contains only filename)
    const filename = audio.filePath;
    const fullPath = path.join(process.cwd(), "data", "uploads", filename);

    // Check if file exists
    try {
      await stat(fullPath);
    } catch {
      return new NextResponse("Audio file not found on disk", { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": fileBuffer.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving audio file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
