import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { AICareerService } from '../lib/career/ai-career-service';

export interface CareerPipelinePayload {
  userId: string;
  resumeId: string;
}

export async function runCareerAnalysisPipeline(payload: CareerPipelinePayload) {
  const { userId, resumeId } = payload;

  // 1. Fetch resume
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error(`Resume not found for ID: ${resumeId}`);
  }

  // 2. Fetch all job match scores for this resume
  const matches = await prisma.jobMatch.findMany({
    where: { resumeId },
    select: {
      overallScore: true,
      skillScore: true,
      techScore: true,
      experienceScore: true,
      missingSkills: true,
      missingTechnologies: true,
    },
  });

  // 3. Perform AI Career Analysis
  const result = await AICareerService.analyze(
    {
      id: resume.id,
      qualityScore: resume.qualityScore,
      structuredData: resume.structuredData,
    },
    matches
  );

  const data = result.structuredData;

  // 4. Save Career Analysis to database
  const careerAnalysis = await prisma.careerAnalysis.upsert({
    where: { userId },
    create: {
      userId,
      resumeId,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      suitableRoles: data.suitableRoles,
      careerPaths: data.careerPaths as any,
      hiringIndustries: data.hiringIndustries,
      estimatedReadiness: data.estimatedReadiness,
      
      missingSkills: data.missingSkills,
      missingTechnologies: data.missingTechnologies,
      frequentSkills: data.frequentSkills,
      criticalGaps: data.criticalGaps,
      strengthAreas: data.strengthAreas,
      
      interviewReadinessScore: data.interviewReadinessScore,
      technicalReadiness: data.technicalReadiness,
      behavioralReadiness: data.behavioralReadiness,
      portfolioStrength: data.portfolioStrength,
      projectQuality: data.projectQuality,
      communicationReadiness: data.communicationReadiness,
      
      careerScore: result.careerScore,
      resumeQualityScore: result.resumeQualityScore,
      jobMatchAvg: result.jobMatchAvg,
      skillCoverageScore: result.skillCoverageScore,
      projectQualityScore: result.projectQualityScore,
      experienceScore: result.experienceScore,
      consistencyScore: result.consistencyScore,
      
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost,
    },
    update: {
      resumeId,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      suitableRoles: data.suitableRoles,
      careerPaths: data.careerPaths as any,
      hiringIndustries: data.hiringIndustries,
      estimatedReadiness: data.estimatedReadiness,
      
      missingSkills: data.missingSkills,
      missingTechnologies: data.missingTechnologies,
      frequentSkills: data.frequentSkills,
      criticalGaps: data.criticalGaps,
      strengthAreas: data.strengthAreas,
      
      interviewReadinessScore: data.interviewReadinessScore,
      technicalReadiness: data.technicalReadiness,
      behavioralReadiness: data.behavioralReadiness,
      portfolioStrength: data.portfolioStrength,
      projectQuality: data.projectQuality,
      communicationReadiness: data.communicationReadiness,
      
      careerScore: result.careerScore,
      resumeQualityScore: result.resumeQualityScore,
      jobMatchAvg: result.jobMatchAvg,
      skillCoverageScore: result.skillCoverageScore,
      projectQualityScore: result.projectQualityScore,
      experienceScore: result.experienceScore,
      consistencyScore: result.consistencyScore,
      
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost,
    },
  });

  // 5. Replace learning roadmaps
  await prisma.learningRoadmap.deleteMany({
    where: { careerAnalysisId: careerAnalysis.id },
  });

  if (data.roadmaps && data.roadmaps.length > 0) {
    const roadmapPromises = data.roadmaps.map((r, idx) => 
      prisma.learningRoadmap.create({
        data: {
          careerAnalysisId: careerAnalysis.id,
          skillName: r.skillName,
          steps: r.steps as any,
          estimatedHours: r.estimatedHours,
          difficulty: r.difficulty,
          prerequisites: r.prerequisites,
          expectedImpact: r.expectedImpact,
          learningOrder: idx + 1,
        },
      })
    );
    await Promise.all(roadmapPromises);
  }

  // 6. Write to CareerSnapshots history (for comparison screens)
  // Ensure we limit snapshots history depth (e.g. max 10 records) to protect Neon storage bounds
  const snapshotsCount = await prisma.careerSnapshot.count({
    where: { userId },
  });

  if (snapshotsCount >= 10) {
    const oldestSnapshot = await prisma.careerSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (oldestSnapshot) {
      await prisma.careerSnapshot.delete({ where: { id: oldestSnapshot.id } });
    }
  }

  await prisma.careerSnapshot.create({
    data: {
      userId,
      resumeId,
      careerScore: result.careerScore,
      overallMatchScore: result.jobMatchAvg,
      resumeQualityScore: result.resumeQualityScore,
      analysisData: {
        summary: data.summary,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        suitableRoles: data.suitableRoles,
        estimatedReadiness: data.estimatedReadiness,
        missingSkills: data.missingSkills,
        interviewReadinessScore: data.interviewReadinessScore,
      } as any,
    },
  });

  // 7. Add a career milestone/insight for the candidate
  await prisma.careerInsight.create({
    data: {
      userId,
      title: 'Career Intelligence Analyzed',
      content: `Your AI Career Score is computed at ${result.careerScore}/100. Growth Roadmap is generated for ${data.roadmaps.length} missing skill stacks.`,
      type: 'milestone',
    },
  });

  return {
    success: true,
    careerScore: result.careerScore,
    userId,
    latencyMs: result.latencyMs,
  };
}

export const careerAnalysisPipeline = task({
  id: 'career-analysis-pipeline',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: CareerPipelinePayload) => {
    return runCareerAnalysisPipeline(payload);
  },
});
