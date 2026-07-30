import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import { ContextBuilder } from '@/lib/copilot/context-builder';
import CandidateCopilotClient from '@/components/CandidateCopilotClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ convId?: string }>;
}

export default async function CopilotPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  const { convId } = await searchParams;

  // 1. Fetch conversational history list for sidebar
  const conversations = await prisma.copilotConversation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true },
  });

  // 2. Fetch messages in active conversation thread if convId supplied
  let initialMessages: any[] = [];
  let activeConvId = null;

  if (convId) {
    const thread = await prisma.copilotConversation.findFirst({
      where: { id: convId, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (thread) {
      activeConvId = thread.id;
      initialMessages = thread.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt,
      }));
    }
  }

  // 3. Fetch structured context values (goals, jobs, reports, chart details)
  const context = await ContextBuilder.buildContext(user.id);

  const activeGoals = await prisma.careerGoal.findMany({
    where: { userId: user.id, status: 'IN_PROGRESS' },
    orderBy: { updatedAt: 'desc' },
  });

  const mappedGoals = activeGoals.map((g) => ({
    id: g.id,
    title: g.title,
    progress: g.progress,
    missingSkills: g.missingSkills,
    targetDate: g.targetDate,
  }));

  const reports = await prisma.weeklyCareerReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const mappedReports = reports.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    careerScoreDelta: r.careerScoreDelta,
    recommendations: r.recommendations,
  }));

  return (
    <CandidateCopilotClient
      careerScore={context.careerScore}
      activeGoals={mappedGoals}
      matchingJobs={context.matchingJobs}
      conversations={conversations}
      reports={mappedReports}
      activeConvId={activeConvId}
      initialMessages={initialMessages}
      skillsProgress={context.skillsProgress}
    />
  );
}
