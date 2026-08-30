import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { sanitizeError } from '@/lib/security/error-handler';
import { createRequestId } from '@/lib/security/request-id';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ questionId: string }> }
) {
  const requestId = createRequestId('eval');

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { questionId } = await props.params;

    const question = await prisma.interviewQuestion.findFirst({
      where: {
        id: questionId,
        session: { user: { clerkId } },
      },
      include: { evaluation: true },
    });

    if (!question) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Question not found' } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      evaluation: question.evaluation,
    });
  } catch (error) {
    console.error('[interview-eval]', requestId, error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: sanitizeError(error, 'Unable to retrieve evaluation.', { action: 'interviewEval', requestId }),
        },
      },
      { status: 500 }
    );
  }
}
