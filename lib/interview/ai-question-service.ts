import { llmRouter } from './llm/router';
import {
  CandidateInterviewMemory,
  GeneratedQuestionPayload,
  QuestionGenerationInput,
} from './llm/types';
import { InterviewPlanner } from './interview-planner';
import { InterviewMemoryService } from './memory-service';
import { isDuplicateQuestion } from './question-meta';

const MAX_DEDUP_RETRIES = 3;

function truncateSnippet(text: string, maxLen = 400): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}…`;
}

async function generateUniqueQuestion(
  baseInput: QuestionGenerationInput,
  recentQuestions: string[]
): Promise<GeneratedQuestionPayload> {
  let lastPayload: GeneratedQuestionPayload | null = null;

  for (let attempt = 0; attempt < MAX_DEDUP_RETRIES; attempt++) {
    const result = await llmRouter.generateQuestion({
      ...baseInput,
      recentQuestions,
    });

    lastPayload = result.data;

    if (!isDuplicateQuestion(result.data.text, recentQuestions)) {
      return result.data;
    }

    recentQuestions = [...recentQuestions, result.data.text];
  }

  return lastPayload!;
}

export class AIQuestionService {
  static async generate(params: {
    resume: unknown;
    job?: unknown;
    difficulty: string;
    categories: string[];
    count?: number;
    userId?: string;
    questionIndex?: number;
    totalSessionQuestions?: number;
    testedSkillsInSession?: string[];
    sessionRecentQuestions?: string[];
  }): Promise<GeneratedQuestionPayload[]> {
    const candidateProfile = InterviewMemoryService.buildCompactResumeProfile(params.resume);
    const jobProfile = params.job ? InterviewMemoryService.buildCompactJobProfile(params.job) : undefined;
    const candidateMemory: CandidateInterviewMemory = params.userId
      ? await InterviewMemoryService.getCandidateMemory(params.userId)
      : {
          skillScores: {},
          strongAreas: [],
          weakAreas: [],
          repeatedWeaknesses: [],
          recentTopics: [],
          projectClaimsTested: [],
          recentlyAskedQuestionIds: [],
          pastQuestionTexts: [],
        };

    const longitudinalSkills = params.userId
      ? await InterviewMemoryService.getLongitudinalSkills(params.userId)
      : [];

    const plan = InterviewPlanner.planNextQuestion({
      candidateProfile,
      jobProfile,
      candidateMemory,
      longitudinalSkills,
      sessionDifficulty: params.difficulty,
      questionIndex: params.questionIndex || 0,
      totalSessionQuestions: params.totalSessionQuestions || 5,
      categories: params.categories,
      testedSkillsInSession: params.testedSkillsInSession,
    });

    const recentQuestionsList = Array.from(new Set([
      ...(params.sessionRecentQuestions || []),
      ...(candidateMemory.pastQuestionTexts || []),
    ])).slice(0, 25);

    const payload = await generateUniqueQuestion(
      {
        candidateProfile,
        jobProfile,
        candidateMemory,
        targetSkill: plan.skill,
        topic: plan.topic,
        intent: plan.intent,
        pattern: plan.pattern,
        difficulty: plan.difficulty,
        recentQuestions: recentQuestionsList,
      },
      recentQuestionsList
    );

    return [payload];
  }

  static async generateFollowUp(params: {
    resume: unknown;
    job?: unknown;
    difficulty: string;
    categories?: string[];
    category?: string;
    previousQuestion?: string;
    previousQuestionTopic?: string;
    recentQuestions?: string[];
    userAnswer: string;
    userId?: string;
    questionIndex?: number;
    totalSessionQuestions?: number;
    previousEvaluation?: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      missingConcepts?: string[];
    };
    testedSkillsInSession?: string[];
  }): Promise<GeneratedQuestionPayload> {
    const candidateProfile = InterviewMemoryService.buildCompactResumeProfile(params.resume);
    const jobProfile = params.job ? InterviewMemoryService.buildCompactJobProfile(params.job) : undefined;
    const candidateMemory: CandidateInterviewMemory = params.userId
      ? await InterviewMemoryService.getCandidateMemory(params.userId)
      : {
          skillScores: {},
          strongAreas: [],
          weakAreas: [],
          repeatedWeaknesses: [],
          recentTopics: [],
          projectClaimsTested: [],
          recentlyAskedQuestionIds: [],
          pastQuestionTexts: [],
        };

    const longitudinalSkills = params.userId
      ? await InterviewMemoryService.getLongitudinalSkills(params.userId)
      : [];

    const evalTopic = params.previousQuestionTopic || params.category || 'Technical';
    const compactPreviousEval = params.previousEvaluation
      ? {
          topic: evalTopic,
          score: params.previousEvaluation.score,
          strength: params.previousEvaluation.strengths[0] || 'Good points',
          weakness: params.previousEvaluation.weaknesses[0] || 'Needs depth',
          missingConcept: params.previousEvaluation.missingConcepts?.[0] || '',
        }
      : undefined;

    const sessionCategories = params.categories && params.categories.length > 0
      ? params.categories
      : (params.category ? [params.category] : ['Technical', 'Behavioral', 'Resume-based', 'Problem Solving']);

    const plan = InterviewPlanner.planNextQuestion({
      candidateProfile,
      jobProfile,
      candidateMemory,
      longitudinalSkills,
      sessionDifficulty: params.difficulty,
      questionIndex: params.questionIndex || 1,
      totalSessionQuestions: params.totalSessionQuestions || 5,
      categories: sessionCategories,
      previousEvaluation: compactPreviousEval,
      testedSkillsInSession: params.testedSkillsInSession,
    });

    const inSessionQuestions = params.recentQuestions && params.recentQuestions.length > 0
      ? params.recentQuestions
      : (params.previousQuestion ? [params.previousQuestion] : []);

    const combinedRecentQuestions = Array.from(new Set([
      ...inSessionQuestions,
      ...(candidateMemory.pastQuestionTexts || []),
    ])).slice(0, 25);

    return generateUniqueQuestion(
      {
        candidateProfile,
        jobProfile,
        candidateMemory,
        targetSkill: plan.skill,
        topic: plan.topic,
        intent: plan.intent,
        pattern: plan.pattern,
        difficulty: plan.difficulty,
        previousAnswerSummary: compactPreviousEval,
        userAnswerSnippet: truncateSnippet(params.userAnswer),
        recentQuestions: combinedRecentQuestions,
      },
      combinedRecentQuestions
    );
  }
}
