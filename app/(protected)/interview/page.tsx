import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateInterviewClient from '@/components/CandidateInterviewClient';
import { InterviewMemoryService } from '@/lib/interview/memory-service';
import { INTERVIEW_LIMITS, isInterviewRateLimitExempt } from '@/lib/interview/constants';

export const dynamic = 'force-dynamic';

export default async function InterviewPrepPage() {
  const user = await getAuthenticatedUser();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Parallelize all initial database lookups
  const [careerAnalysis, pastSessions, savedJobs, appliedJobs, latestResume, todaySessionsCount, longitudinalSkills] = await Promise.all([
    prisma.careerAnalysis.findUnique({
      where: { userId: user.id },
      select: {
        interviewReadinessScore: true,
        technicalReadiness: true,
        behavioralReadiness: true,
        communicationReadiness: true,
      },
    }),
    prisma.interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        sessionLength: true,
        difficulty: true,
        overallScore: true,
        createdAt: true,
      },
    }),
    prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      select: {
        opportunityId: true,
        opportunity: {
          select: {
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.application.findMany({
      where: { userId: user.id },
      select: {
        opportunityId: true,
        opportunity: {
          select: {
            title: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      select: { id: true },
      orderBy: { version: 'desc' },
    }),
    prisma.interviewSession.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    }),
    InterviewMemoryService.getLongitudinalSkills(user.id),
  ]);

  const readiness = {
    overall: careerAnalysis?.interviewReadinessScore || 70,
    technical: careerAnalysis?.technicalReadiness || 70,
    behavioral: careerAnalysis?.behavioralReadiness || 70,
    communication: careerAnalysis?.communicationReadiness || 70,
  };

  const completedSessions = pastSessions.filter(s => s.status === 'COMPLETED');
  const totalSessions = completedSessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions)
    : 70;

  // Fetch summaries and evaluations only if there are completed sessions
  const sessionIds = completedSessions.slice(0, 10).map(s => s.id);
  let strongestAreas: string[] = [];
  let weakestAreas: string[] = [];
  let recommendedPractice: string[] = [];

  if (sessionIds.length > 0) {
    const [evaluations, summaries] = await Promise.all([
      prisma.interviewEvaluation.findMany({
        where: { question: { sessionId: { in: sessionIds } } },
        select: { strengths: true, weaknesses: true },
      }),
      prisma.interviewSummary.findMany({
        where: { sessionId: { in: sessionIds } },
        select: { recommendedPractice: true },
      }),
    ]);

    const strengthCounts: Record<string, number> = {};
    const weaknessCounts: Record<string, number> = {};

    evaluations.forEach(e => {
      e.strengths.forEach(s => { strengthCounts[s] = (strengthCounts[s] || 0) + 1; });
      e.weaknesses.forEach(w => { weaknessCounts[w] = (weaknessCounts[w] || 0) + 1; });
    });

    strongestAreas = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    weakestAreas = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    const practiceCounts: Record<string, number> = {};
    summaries.forEach(s => {
      s.recommendedPractice.forEach(p => { practiceCounts[p] = (practiceCounts[p] || 0) + 1; });
    });

    recommendedPractice = Object.entries(practiceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);
  }

  // Fallback defaults if no sessions run yet
  if (strongestAreas.length === 0) strongestAreas.push('Concepts explanation', 'Clarity of presentation');
  if (weakestAreas.length === 0) weakestAreas.push('STAR storytelling details', 'Project metrics indicators');
  if (recommendedPractice.length === 0) recommendedPractice.push('STAR method behavioral stories', 'System Design concepts');

  // Combine unique opportunities
  const uniqueJobOptionsMap: Record<string, { id: string; title: string; companyName: string }> = {};
  
  savedJobs.forEach(sj => {
    uniqueJobOptionsMap[sj.opportunityId] = {
      id: sj.opportunityId,
      title: sj.opportunity.title,
      companyName: sj.opportunity.company.name,
    };
  });

  appliedJobs.forEach(aj => {
    uniqueJobOptionsMap[aj.opportunityId] = {
      id: aj.opportunityId,
      title: aj.opportunity.title,
      companyName: aj.opportunity.company.name,
    };
  });

  const jobOptions = Object.values(uniqueJobOptionsMap);
  const isAdmin = isInterviewRateLimitExempt(user.email);
  const dailyInterviewsRemaining = isAdmin
    ? 999
    : Math.max(0, INTERVIEW_LIMITS.maxFreeInterviewsPerDay - todaySessionsCount);

  return (
    <CandidateInterviewClient
      readiness={readiness}
      stats={{
        totalSessions,
        avgScore,
        strongestAreas,
        weakestAreas,
        recommendedPractice,
      }}
      jobOptions={jobOptions}
      pastSessions={pastSessions}
      hasResume={!!latestResume}
      longitudinalSkills={longitudinalSkills}
      dailyInterviewsRemaining={dailyInterviewsRemaining}
    />
  );
}
