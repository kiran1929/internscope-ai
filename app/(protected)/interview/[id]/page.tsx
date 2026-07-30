import React from 'react';
import { notFound } from 'next/navigation';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidatePracticeSessionClient from '@/components/CandidatePracticeSessionClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticeSessionPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  const { id } = await params;

  // 1. Fetch target session details, checking user ownership
  const session = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      summary: true,
      questions: {
        orderBy: { order: 'asc' },
        include: {
          answer: true,
          evaluation: true,
        },
      },
    },
  });

  if (!session || session.userId !== user.id) {
    notFound();
  }

  // 2. Map structures to match component prop expectations
  const mappedSession = {
    id: session.id,
    title: session.title,
    status: session.status,
    sessionLength: session.sessionLength,
    difficulty: session.difficulty,
    categories: session.categories,
    overallScore: session.overallScore,
    technicalScore: session.technicalScore,
    behavioralScore: session.behavioralScore,
    communicationScore: session.communicationScore,
    confidenceScore: session.confidenceScore,
    summary: session.summary ? {
      overallFeedback: session.summary.overallFeedback,
      keyStrengths: session.summary.keyStrengths,
      keyWeaknesses: session.summary.keyWeaknesses,
      recommendedPractice: session.summary.recommendedPractice,
    } : null,
    questions: session.questions.map((q) => ({
      id: q.id,
      category: q.category,
      text: q.text,
      difficulty: q.difficulty,
      order: q.order,
      answer: q.answer ? { userAnswer: q.answer.userAnswer } : null,
      evaluation: q.evaluation ? {
        score: q.evaluation.score,
        technicalAccuracy: q.evaluation.technicalAccuracy,
        communication: q.evaluation.communication,
        completeness: q.evaluation.completeness,
        problemSolving: q.evaluation.problemSolving,
        confidence: q.evaluation.confidence,
        structure: q.evaluation.structure,
        strengths: q.evaluation.strengths,
        weaknesses: q.evaluation.weaknesses,
        improvedAnswer: q.evaluation.improvedAnswer,
        starMethodFollowed: q.evaluation.starMethodFollowed,
        starSituation: q.evaluation.starSituation,
        starTask: q.evaluation.starTask,
        starAction: q.evaluation.starAction,
        starResult: q.evaluation.starResult,
        starCoachingFeedback: q.evaluation.starCoachingFeedback,
      } : null,
    })),
  };

  return (
    <CandidatePracticeSessionClient
      session={mappedSession}
    />
  );
}
