import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    .map(q => q.evaluation)
    .filter((e): e is Exclude<typeof e, null> => e !== null);

  if (completedEvaluations.length === 0) {
    throw new Error(`Cannot generate summary: no questions have been evaluated yet.`);
  }

  // 2. Compute average scores
  const count = completedEvaluations.length;
  const overallScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.score, 0) / count);
  const technicalScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.technicalAccuracy, 0) / count);
  const behavioralScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.communication, 0) / count); // proxy behavioral to communication/completeness mix
  const communicationScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.communication, 0) / count);
  const confidenceScore = Math.round(completedEvaluations.reduce((acc, e) => acc + e.confidence, 0) / count);

  // 3. Generate summary text via Gemini or fallback
  const apiKey = process.env.GEMINI_API_KEY;
  let overallFeedback = 'You completed your mock interview session. Key strengths include code explanations and communication style. Focus on providing measurable metrics under STAR.';
  const keyStrengths: string[] = [];
  const keyWeaknesses: string[] = [];
  const recommendedPractice: string[] = [];
  let provider = 'Mock-Local';
  let model = 'rules-engine';
  let tokensUsed = 0;
  let estimatedCost = 0.0;

  // Aggregate strengths and weaknesses from all answers
  completedEvaluations.forEach(e => {
    e.strengths.forEach(s => { if (keyStrengths.length < 3 && !keyStrengths.includes(s)) keyStrengths.push(s); });
    e.weaknesses.forEach(w => { if (keyWeaknesses.length < 3 && !keyWeaknesses.includes(w)) keyWeaknesses.push(w); });
  });

  if (keyStrengths.length === 0) keyStrengths.push('Prompt technical answers', 'Accurate concepts');
  if (keyWeaknesses.length === 0) keyWeaknesses.push(' STAR method format details', 'Provide outcome measurements');
  recommendedPractice.push('STAR method behavioral phrasing', 'System design layouts', 'NoSQL scaling architectures');

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const analysisPrompt = `
You are an executive mock interviewer. Summarize the performance of the candidate across these evaluated answers.
Evaluated details:
- Scores: Overall ${overallScore}%, Tech Accuracy ${technicalScore}%, Communication ${communicationScore}%
- Strengths aggregated: ${JSON.stringify(keyStrengths)}
- Weaknesses aggregated: ${JSON.stringify(keyWeaknesses)}

Return exactly a JSON object matching this schema:
{
  "overallFeedback": "A comprehensive paragraph summarizing performance, confidence, and growth strategies.",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "keyWeaknesses": ["Weakness 1", "Weakness 2"],
  "recommendedPractice": ["Practice Topic 1", "Practice Topic 2"]
}
`;

      const response = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      const text = response.response.text();
      if (text) {
        const payload = JSON.parse(text);
        overallFeedback = payload.overallFeedback || overallFeedback;
        if (Array.isArray(payload.keyStrengths)) {
          keyStrengths.length = 0;
          payload.keyStrengths.forEach((s: string) => keyStrengths.push(s));
        }
        if (Array.isArray(payload.keyWeaknesses)) {
          keyWeaknesses.length = 0;
          payload.keyWeaknesses.forEach((w: string) => keyWeaknesses.push(w));
        }
        if (Array.isArray(payload.recommendedPractice)) {
          recommendedPractice.length = 0;
          payload.recommendedPractice.forEach((p: string) => recommendedPractice.push(p));
        }

        provider = 'Gemini';
        model = 'gemini-1.5-flash';
        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
        estimatedCost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);
      }
    } catch (err) {
      console.warn('Gemini summary generation failed, falling back to local aggregator:', err);
    }
  }

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
      provider,
      model,
      tokensUsed,
      estimatedCost,
      latencyMs: Date.now() - startTime,
    },
    update: {
      overallFeedback,
      keyStrengths,
      keyWeaknesses,
      recommendedPractice,
      provider,
      model,
      tokensUsed,
      estimatedCost,
      latencyMs: Date.now() - startTime,
    },
  });

  // 6. Update the user's Interview Readiness in CareerAnalysis
  // Find user's average interview score across all COMPLETED sessions
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
  const avgConf = Math.round(completedSessionsAgg._avg.confidenceScore || confidenceScore);

  await prisma.careerAnalysis.update({
    where: { userId: session.userId },
    data: {
      interviewReadinessScore: avgReadiness,
      technicalReadiness: avgTech,
      behavioralReadiness: avgBehavioral,
      communicationReadiness: avgComm,
      estimatedReadiness: avgReadiness / 100, // Sync estimated readiness to job matching
    },
  });

  // 7. Add a career insight milestone
  await prisma.careerInsight.create({
    data: {
      userId: session.userId,
      title: 'Mock Interview Completed',
      content: `Completed mock session "${session.title}" with score ${overallScore}%. Readiness scores updated.`,
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
