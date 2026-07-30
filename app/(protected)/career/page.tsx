import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateCareerClient from '@/components/CandidateCareerClient';

export const dynamic = 'force-dynamic';

export default async function CareerIntelligencePage() {
  const user = await getAuthenticatedUser();

  // 1. Check if user has uploaded a resume
  const latestResume = await prisma.resume.findFirst({
    where: { userId: user.id },
    orderBy: { version: 'desc' },
  });

  const hasResume = !!latestResume;

  // 2. Fetch the latest career analysis
  const careerAnalysis = await prisma.careerAnalysis.findUnique({
    where: { userId: user.id },
    include: {
      roadmaps: {
        orderBy: { learningOrder: 'asc' },
      },
    },
  });

  // 3. Fetch snapshots history
  const snapshots = await prisma.careerSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const mappedSnapshots = snapshots.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    careerScore: s.careerScore,
    overallMatchScore: s.overallMatchScore,
    resumeQualityScore: s.resumeQualityScore,
    analysisData: s.analysisData,
  }));

  const mappedAnalysis = careerAnalysis ? {
    id: careerAnalysis.id,
    summary: careerAnalysis.summary,
    strengths: careerAnalysis.strengths,
    weaknesses: careerAnalysis.weaknesses,
    suitableRoles: careerAnalysis.suitableRoles,
    careerPaths: careerAnalysis.careerPaths,
    hiringIndustries: careerAnalysis.hiringIndustries,
    estimatedReadiness: careerAnalysis.estimatedReadiness,
    
    missingSkills: careerAnalysis.missingSkills,
    missingTechnologies: careerAnalysis.missingTechnologies,
    frequentSkills: careerAnalysis.frequentSkills,
    criticalGaps: careerAnalysis.criticalGaps,
    strengthAreas: careerAnalysis.strengthAreas,
    
    interviewReadinessScore: careerAnalysis.interviewReadinessScore,
    technicalReadiness: careerAnalysis.technicalReadiness,
    behavioralReadiness: careerAnalysis.behavioralReadiness,
    portfolioStrength: careerAnalysis.portfolioStrength,
    projectQuality: careerAnalysis.projectQuality,
    communicationReadiness: careerAnalysis.communicationReadiness,

    careerScore: careerAnalysis.careerScore,
    resumeQualityScore: careerAnalysis.resumeQualityScore,
    jobMatchAvg: careerAnalysis.jobMatchAvg,
    skillCoverageScore: careerAnalysis.skillCoverageScore,
    projectQualityScore: careerAnalysis.projectQualityScore,
    experienceScore: careerAnalysis.experienceScore,
    consistencyScore: careerAnalysis.consistencyScore,
    
    provider: careerAnalysis.provider,
    model: careerAnalysis.model,
    tokensUsed: careerAnalysis.tokensUsed,
    latencyMs: careerAnalysis.latencyMs,
    estimatedCost: careerAnalysis.estimatedCost,
    updatedAt: careerAnalysis.updatedAt,
    
    roadmaps: careerAnalysis.roadmaps.map((r) => ({
      id: r.id,
      skillName: r.skillName,
      steps: r.steps,
      estimatedHours: r.estimatedHours,
      difficulty: r.difficulty,
      prerequisites: r.prerequisites,
      expectedImpact: r.expectedImpact,
      learningOrder: r.learningOrder,
    })),
  } : null;

  return (
    <CandidateCareerClient
      analysis={mappedAnalysis}
      snapshots={mappedSnapshots}
      hasResume={hasResume}
    />
  );
}
