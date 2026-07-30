import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ questionId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId } = await props.params;

    // Load question and verify user session ownership
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: {
        session: true,
        evaluation: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Verify User owns the session associated with the question
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!dbUser || question.session.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      evaluation: question.evaluation,
    });
  } catch (error) {
    console.error('Failed to get interview evaluation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
