import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateInterviewClient from '@/components/CandidateInterviewClient';

export const dynamic = 'force-dynamic';

export default async function InterviewPrepPage() {
  const user = await getAuthenticatedUser();

  // 1. Fetch user's interview readiness scores from CareerAnalysis
  const careerAnalysis = await prisma.careerAnalysis.findUnique({
    where: { userId: user.id },
  });

  const readiness = {
    overall: careerAnalysis?.interviewReadinessScore || 70,
    technical: careerAnalysis?.technicalReadiness || 70,
    behavioral: careerAnalysis?.behavioralReadiness || 70,
    communication: careerAnalysis?.communicationReadiness || 70,
  };

  // 2. Fetch past mock interview sessions
  const pastSessions = await prisma.interviewSession.findMany({
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
  });

  const completedSessions = pastSessions.filter(s => s.status === 'COMPLETED');
  const totalSessions = completedSessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions)
    : 70;

  // 3. Fetch all completed session evaluations to map strengths and weaknesses
  const sessionIds = completedSessions.map(s => s.id);
  
  const evaluations = await prisma.interviewEvaluation.findMany({
    where: {
      question: {
        sessionId: { in: sessionIds },
      },
    },
    select: { strengths: true, weaknesses: true },
  });

  const strengthCounts: Record<string, number> = {};
  const weaknessCounts: Record<string, number> = {};

  evaluations.forEach(e => {
    e.strengths.forEach(s => { strengthCounts[s] = (strengthCounts[s] || 0) + 1; });
    e.weaknesses.forEach(w => { weaknessCounts[w] = (weaknessCounts[w] || 0) + 1; });
  });

  const strongestAreas = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 3);

  const weakestAreas = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 3);

  // 4. Fetch recommended practices from Summaries
  const summaries = await prisma.interviewSummary.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { recommendedPractice: true },
  });

  const practiceCounts: Record<string, number> = {};
  summaries.forEach(s => {
    s.recommendedPractice.forEach(p => { practiceCounts[p] = (practiceCounts[p] || 0) + 1; });
  });

  const recommendedPractice = Object.entries(practiceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 3);

  // Fallback defaults if no sessions run yet
  if (strongestAreas.length === 0) strongestAreas.push('Concepts explanation', 'Clarity of presentation');
  if (weakestAreas.length === 0) weakestAreas.push('STAR storytelling details', 'Project metrics indicators');
  if (recommendedPractice.length === 0) recommendedPractice.push('STAR method behavioral stories', 'System Design concepts');

  // 5. Fetch job opportunities they can choose to practice for (saved or applied)
  const [savedJobs, appliedJobs] = await Promise.all([
    prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      include: { opportunity: { include: { company: true } } },
    }),
    prisma.application.findMany({
      where: { userId: user.id },
      include: { opportunity: { include: { company: true } } },
    }),
  ]);

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
    />
  );
}
