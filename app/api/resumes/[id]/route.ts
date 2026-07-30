import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/resume/storage-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;

    // Load the resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.user.clerkId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fileBuffer = await StorageService.readFile(resume.filePath);

    // Determine the content disposition and content type
    let contentType = resume.mimeType;
    if (!contentType) {
      contentType = resume.fileName.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(resume.fileName)}"`,
      },
    });
  } catch (error) {
    console.error('Secure resume download error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
