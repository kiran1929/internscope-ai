import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';
import { sanitizeError } from '@/lib/security/error-handler';
import { createRequestId } from '@/lib/security/request-id';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId('resume');

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await props.params;

    const resume = await prisma.resume.findFirst({
      where: {
        id,
        user: { clerkId },
        processingStatus: { not: 'DELETED' },
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        mimeType: true,
      },
    });

    if (!resume || !resume.filePath || resume.filePath === 'PENDING') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } }, { status: 404 });
    }

    const fileBuffer = await StorageService.readFile(resume.filePath);

    const contentType =
      resume.mimeType ||
      (resume.fileName.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const safeFileName = resume.fileName.replace(/[\r\n"]/g, '_');

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    console.error('[resume-download]', requestId, error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: sanitizeError(error, 'Unable to retrieve resume.', { action: 'resumeDownload', requestId }),
        },
      },
      { status: 500 }
    );
  }
}
