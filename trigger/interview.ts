import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { llmRouter } from '../lib/interview/llm/router';
import { InterviewMemoryService } from '../lib/interview/memory-service';

export interface InterviewPipelinePayload {
  sessionId: string;
}

export async function runInterviewSummaryPipeline(payload: InterviewPipelinePayload) {
  const { sessionId } = payload;
  const startTime = Date.now();

  // 1. Fetch the session details with evaluations
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: {
        include: {
          evaluation: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Interview session not found with ID: ${sessionId}`);
  }

  const completedEvaluations = session.questions
    .map((q) => q.evaluation)
    .filter((e): e is Exclude<typeof e, null> => e !== null);

  if (completedEvaluations.length === 0) {
    throw new Error(`Cannot generate summary: no questions have been evaluated yet.`);
  }

  // 2. Compute average scores deterministically in TypeScript
  const count = completedEvaluations.length;
  const overallScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.score, 0) / count);
  const technicalScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.technicalAccuracy, 0) / count);
  const behavioralScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.communication, 0) / count);
  const communicationScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.communication, 0) / count);
  const confidenceScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.confidence, 0) / count);

  // 3. Generate summary via LLMRouter (Groq primary -> Gemini fallback)
  const summaryPayload = completedEvaluations.map((e) => ({
    score: e.score,
    technicalAccuracy: e.technicalAccuracy,
    communication: e.communication,
    completeness: e.completeness,
    problemSolving: e.problemSolving,
    confidence: e.confidence,
    structure: e.structure,
    strengths: e.strengths,
    weaknesses: e.weaknesses,
    improvedAnswer: e.improvedAnswer || '',
    starMethodFollowed: e.starMethodFollowed,
    starSituation: e.starSituation,
    starTask: e.starTask,
    starAction: e.starAction,
    starResult: e.starResult,
    starCoachingFeedback: e.starCoachingFeedback,
  }));

  const summaryResult = await llmRouter.generateSummary({
    overallScore,
    technicalScore,
    communicationScore,
    completedEvaluations: summaryPayload,
    sessionTitle: session.title,
  });

  const { overallFeedback, keyStrengths, keyWeaknesses, recommendedPractice } = summaryResult.data;

  // 4. Update the Interview Session scores and status
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      overallScore,
      technicalScore,
      behavioralScore,
      communicationScore,
      confidenceScore,
    },
  });

  // 5. Persist the session Summary
  await prisma.interviewSummary.upsert({
    where: { sessionId },
    create: {
      sessionId,
      overallFeedback,
      keyStrengths,
      keyWeaknesses,
      recommendedPractice,
      provider: summaryResult.metrics.provider,
      model: summaryResult.metrics.model,
      tokensUsed: summaryResult.metrics.inputTokens + summaryResult.metrics.outputTokens,
      estimatedCost: 0.0,
      latencyMs: summaryResult.metrics.latencyMs,
    },
    update: {
      overallFeedback,
      keyStrengths,
      keyWeaknesses,
      recommendedPractice,
      provider: summaryResult.metrics.provider,
      model: summaryResult.metrics.model,
      tokensUsed: summaryResult.metrics.inputTokens + summaryResult.metrics.outputTokens,
      estimatedCost: 0.0,
      latencyMs: summaryResult.metrics.latencyMs,
    },
  });

  // 6. Update Longitudinal Candidate Skill Memory
  const sessionCategorySkills = session.questions
    .filter((q) => q.evaluation !== null)
    .map((q) => ({
      skill: q.category,
      score: q.evaluation!.score,
    }));

  await InterviewMemoryService.updateLongitudinalSkillMemory(
    session.userId,
    summaryPayload,
    sessionCategorySkills
  );

  // 7. Update User's Interview Readiness in CareerAnalysis
  const completedSessionsAgg = await prisma.interviewSession.aggregate({
    where: {
      userId: session.userId,
      status: 'COMPLETED',
    },
    _avg: {
      overallScore: true,
      technicalScore: true,
      behavioralScore: true,
      communicationScore: true,
      confidenceScore: true,
    },
  });

  const avgReadiness = Math.round(completedSessionsAgg._avg.overallScore || overallScore);
  const avgTech = Math.round(completedSessionsAgg._avg.technicalScore || technicalScore);
  const avgBehavioral = Math.round(completedSessionsAgg._avg.behavioralScore || behavioralScore);
  const avgComm = Math.round(completedSessionsAgg._avg.communicationScore || communicationScore);

  await prisma.careerAnalysis.update({
    where: { userId: session.userId },
    data: {
      interviewReadinessScore: avgReadiness,
      technicalReadiness: avgTech,
      behavioralReadiness: avgBehavioral,
      communicationReadiness: avgComm,
      estimatedReadiness: avgReadiness / 100,
    },
  });

  // 8. Add a career insight milestone
  await prisma.careerInsight.create({
    data: {
      userId: session.userId,
      title: 'Mock Interview Completed',
      content: `Completed mock session "${session.title}" with score ${overallScore}%. Longitudinal skill memory & readiness updated.`,
      type: 'milestone',
    },
  });

  return {
    success: true,
    sessionId,
    overallScore,
    latencyMs: Date.now() - startTime,
  };
}

export const interviewSummaryPipeline = task({
  id: 'interview-summary-pipeline',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: InterviewPipelinePayload) => {
    return runInterviewSummaryPipeline(payload);
  },
});
