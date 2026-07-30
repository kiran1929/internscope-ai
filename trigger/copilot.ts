import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { AIOrchestrator } from '../lib/copilot/ai-orchestrator';

export interface WeeklyReportPayload {
  userId: string;
}

export async function runWeeklyReportPipeline(payload: WeeklyReportPayload) {
  const { userId } = payload;
  const startTime = Date.now();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Fetch user snapshots and activities
  const [
    snapshots,
    optimizations,
    interviews,
    careerAnalysis,
    newJobsCount,
  ] = await Promise.all([
    prisma.careerSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 2,
    }),
    prisma.resumeOptimization.findMany({
      where: { userId, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.interviewSession.findMany({
      where: { userId, status: 'COMPLETED', createdAt: { gte: oneWeekAgo } },
    }),
    prisma.careerAnalysis.findUnique({
      where: { userId },
      include: { roadmaps: true },
    }),
    prisma.opportunity.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  // 2. Compute delta metrics
  let careerScoreDelta = 0.0;
  if (snapshots.length >= 2) {
    careerScoreDelta = snapshots[0].careerScore - snapshots[1].careerScore;
  }

  const resumeImprovements: string[] = [];
  if (optimizations.length > 0) {
    resumeImprovements.push(`Created ${optimizations.length} ATS-optimized resume copies.`);
  } else {
    resumeImprovements.push('No new resume optimization revisions recorded this week.');
  }

  let interviewProgress = 'No completed mock interview sessions logged this week.';
  if (interviews.length > 0) {
    const avgIntScore = Math.round(interviews.reduce((acc, s) => acc + (s.overallScore || 0), 0) / interviews.length);
    interviewProgress = `Completed ${interviews.length} mock interview sessions with an average performance score of ${avgIntScore}%.`;
  }

  const skillsLearned: string[] = [];
  if (careerAnalysis) {
    // Check roadmap items completed or skills currently on resume
    const latestResume = await prisma.resume.findFirst({
      where: { userId, isParsed: true },
      orderBy: { version: 'desc' },
    });
    if (latestResume) {
      const data = latestResume.structuredData as any;
      if (data && Array.isArray(data.skills)) {
        skillsLearned.push(...data.skills.slice(0, 3));
      }
    }
  }

  if (skillsLearned.length === 0) {
    skillsLearned.push('TypeScript', 'React');
  }

  // 3. Prompt AI to compile comprehensive weekly review recommendations
  const apiKey = process.env.GEMINI_API_KEY;
  const recommendations: string[] = [];
  let provider = 'Mock-Local';
  let modelName = 'rules-engine';
  let tokensUsed = 0;
  let estimatedCost = 0.0;

  if (apiKey) {
    try {
      const reportPrompt = `
You are a senior executive career coach. Synthesize a list of 3 strategic recommendations for this candidate's weekly career progression report.
Weekly status metrics:
- Career Score Delta: ${careerScoreDelta >= 0 ? '+' : ''}${careerScoreDelta}
- Resume Tailoring: ${JSON.stringify(resumeImprovements)}
- Mock Interviews Attempted: ${interviewProgress}
- Skills Mastered: ${JSON.stringify(skillsLearned)}

Return exactly a JSON array containing 3 strategic recommendation strings.
`;

      const aiResult = await AIOrchestrator.generate({
        prompt: reportPrompt,
        responseMimeType: 'application/json',
      });

      const parsedArray = JSON.parse(aiResult.text);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach((rec: string) => recommendations.push(String(rec)));
      }
      provider = aiResult.provider;
      modelName = aiResult.model;
      tokensUsed = aiResult.tokensUsed;
      estimatedCost = aiResult.estimatedCost;
    } catch (err) {
      console.warn('Failed to generate AI weekly report recommendations, using mock fallbacks:', err);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Schedule a behavioral interview mock practice session to focus on STAR metrics.',
      'Incorporate TypeScript and Docker container tags into your primary resume skills section.',
      'Complete the REST API design steps on your active database roadmap.'
    );
  }

  // 4. Save WeeklyCareerReport record
  const report = await prisma.weeklyCareerReport.create({
    data: {
      userId,
      startDate: oneWeekAgo,
      endDate: new Date(),
      careerScoreDelta,
      resumeImprovements,
      interviewProgress,
      newMatchingJobsCount: newJobsCount,
      skillsLearned,
      recommendations,
      provider,
      model: modelName,
      tokensUsed,
      estimatedCost,
      latencyMs: Date.now() - startTime,
    },
  });

  return {
    success: true,
    reportId: report.id,
    careerScoreDelta,
    latencyMs: Date.now() - startTime,
  };
}

// Trigger.dev background tasks configurations
export const weeklyReportPipeline = task({
  id: 'weekly-report-pipeline',
  retry: { maxAttempts: 3 },
  run: async (payload: WeeklyReportPayload) => {
    return runWeeklyReportPipeline(payload);
  },
});
