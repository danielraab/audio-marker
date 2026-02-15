import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { env } from '~/env';
import { generateAndSavePeaks } from '~/lib/peaks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> }
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
      },
    });

    if (!audio) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    // Check access permissions
    const isCreator = session?.user?.id === audio.createdById;
    const hasAccess = audio.isPublic || isCreator;

    if (env.REQUIRE_AUTH_FOR_PUBLIC_CONTENT && !session) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Construct peaks file path: same name as audio file but with .json extension
    const audioFileName = audio.filePath;
    const parsed = path.parse(audioFileName);
    const peaksFileName = `${parsed.name}.json`;
    const fullPath = path.join(process.cwd(), 'data', 'uploads', peaksFileName);

    // Check if peaks file exists; if not, generate on the fly from the audio file
    try {
      await stat(fullPath);
    } catch {
      // Peaks file doesn't exist — try to generate it from the audio file
      const audioFullPath = path.join(process.cwd(), 'data', 'uploads', audioFileName);
      try {
        await stat(audioFullPath);
      } catch {
        return new NextResponse('Audio file not found on disk', { status: 404 });
      }

      try {
        await generateAndSavePeaks(audioFullPath);
      } catch (genError) {
        console.error('On-the-fly peak generation failed:', genError);
        return new NextResponse('Peak generation failed', { status: 500 });
      }
    }

    // Read and return the peaks JSON
    const fileBuffer = await readFile(fullPath, 'utf-8');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving peaks file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
