import { llmRouter } from './llm/router';
import {
  AnswerEvaluationPayload,
  InterviewDifficulty,
  QuestionIntent,
} from './llm/types';

export interface AIEvalResult {
  structuredData: AnswerEvaluationPayload;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export class AIEvalService {
  static async evaluate(params: {
    questionText: string;
    sampleAnswer?: string;
    userAnswer: string;
    category: string;
    targetSkill?: string;
    difficulty?: string;
    intent?: QuestionIntent;
    expectedConcepts?: string[];
  }): Promise<AIEvalResult> {
    const result = await llmRouter.evaluateAnswer({
      questionText: params.questionText,
      sampleAnswer: params.sampleAnswer,
      userAnswer: params.userAnswer,
      category: params.category,
      targetSkill: params.targetSkill,
      difficulty: (params.difficulty as InterviewDifficulty) || 'Medium',
      intent: params.intent,
      expectedConcepts: params.expectedConcepts,
    });

    return {
      structuredData: result.data,
      provider: result.metrics.provider,
      model: result.metrics.model,
      tokensUsed: result.metrics.inputTokens + result.metrics.outputTokens,
      latencyMs: result.metrics.latencyMs,
    };
  }
}
