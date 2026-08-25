import { llmRouter } from './llm/router';
import {
  CandidateInterviewMemory,
  GeneratedQuestionPayload,
} from './llm/types';
import { InterviewPlanner } from './interview-planner';
import { InterviewMemoryService } from './memory-service';

export class AIQuestionService {
  /**
   * Generates a planned, token-optimized single interview question.
   */
  static async generate(params: {
    resume: unknown;
    job?: unknown;
    difficulty: string;
    categories: string[];
    count?: number; // Maintained for backwards compatibility, always generates 1 question
    userId?: string;
    questionIndex?: number;
    totalSessionQuestions?: number;
    testedSkillsInSession?: string[];
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
        };

    const longitudinalSkills = params.userId
      ? await InterviewMemoryService.getLongitudinalSkills(params.userId)
      : [];

    // Plan the next question deterministically
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

    const result = await llmRouter.generateQuestion({
      candidateProfile,
      jobProfile,
      candidateMemory,
      targetSkill: plan.skill,
      topic: plan.topic,
      intent: plan.intent,
      difficulty: plan.difficulty,
      recentQuestions: [],
    });

    return [result.data];
  }

  /**
   * Generates an adaptive follow-up or next question based on the candidate's previous evaluated response.
   */
  static async generateFollowUp(params: {
    resume: unknown;
    job?: unknown;
    difficulty: string;
    categories?: string[];
    category?: string; // backwards compatibility
    previousQuestion?: string;
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
        };

    const longitudinalSkills = params.userId
      ? await InterviewMemoryService.getLongitudinalSkills(params.userId)
      : [];

    const compactPreviousEval = params.previousEvaluation
      ? {
          topic: params.category || 'Technical',
          score: params.previousEvaluation.score,
          strength: params.previousEvaluation.strengths[0] || 'Good points',
          weakness: params.previousEvaluation.weaknesses[0] || 'Needs depth',
          missingConcept: params.previousEvaluation.missingConcepts?.[0] || '',
        }
      : undefined;

    const sessionCategories = params.categories && params.categories.length > 0
      ? params.categories
      : (params.category ? [params.category] : ['Technical', 'Behavioral', 'Resume-based', 'Problem Solving']);

    // Use planner to decide next question strategically
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

    const recentQuestionsList = params.recentQuestions && params.recentQuestions.length > 0
      ? params.recentQuestions
      : (params.previousQuestion ? [params.previousQuestion] : []);

    const result = await llmRouter.generateQuestion({
      candidateProfile,
      jobProfile,
      candidateMemory,
      targetSkill: plan.skill,
      topic: plan.topic,
      intent: plan.intent,
      difficulty: plan.difficulty,
      previousAnswerSummary: compactPreviousEval,
      recentQuestions: recentQuestionsList,
    });

    return result.data;
  }
}
