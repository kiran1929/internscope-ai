import { z } from 'zod';

export type QuestionIntent =
  | 'resume_verification'
  | 'project_deep_dive'
  | 'skill_assessment'
  | 'weakness_probe'
  | 'job_requirement'
  | 'debugging'
  | 'system_design'
  | 'tradeoff_analysis'
  | 'scenario_based'
  | 'behavioral'
  | 'follow_up';

export type QuestionPattern =
  | 'architectural_tradeoff'
  | 'failure_debugging'
  | 'code_internals'
  | 'real_world_scenario'
  | 'scaling_bottleneck'
  | 'security_resilience'
  | 'star_behavioral'
  | 'live_follow_up';

export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export interface CandidateResumeProfile {
  summary: string;
  skills: string[];
  technologies: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    candidateContribution?: string;
    topics: string[];
  }[];
  experience: {
    role?: string;
    company?: string;
    technologies: string[];
    responsibilities: string[];
  }[];
}

export interface JobInterviewProfile {
  role: string;
  company?: string;
  coreSkills: string[];
  secondarySkills: string[];
  technologies: string[];
  interviewTopics: string[];
  behavioralTraits: string[];
  priorityAreas: {
    topic: string;
    priority: number;
  }[];
}

export interface CompactAnswerSummary {
  topic: string;
  score: number;
  strength: string;
  weakness: string;
  missingConcept: string;
}

export interface CandidateInterviewMemory {
  skillScores: Record<string, number>;
  strongAreas: string[];
  weakAreas: string[];
  repeatedWeaknesses: string[];
  recentTopics: string[];
  projectClaimsTested: string[];
  recentlyAskedQuestionIds: string[];
  pastQuestionTexts: string[];
}

export interface LongitudinalSkillRecord {
  skill: string;
  averageScore: number;
  recentScore: number;
  attemptCount: number;
  trend: 'improving' | 'steady' | 'weak';
  lastTested: string;
}

export interface QuestionGenerationInput {
  candidateProfile: CandidateResumeProfile;
  jobProfile?: JobInterviewProfile;
  candidateMemory: CandidateInterviewMemory;
  targetSkill: string;
  topic: string;
  intent: QuestionIntent;
  pattern?: QuestionPattern;
  difficulty: InterviewDifficulty;
  previousAnswerSummary?: CompactAnswerSummary;
  recentQuestions?: string[];
  /** Short excerpt from the candidate's last answer — used for follow-up questions. */
  userAnswerSnippet?: string;
}

export interface GeneratedQuestionPayload {
  category: 'Technical' | 'Behavioral' | 'Resume-based' | 'Project-based' | 'Problem Solving' | 'Company Research' | 'Role-specific';
  text: string;
  difficulty: InterviewDifficulty;
  sampleAnswer: string;
  intent?: QuestionIntent;
  pattern?: QuestionPattern;
  skill?: string;
  topic?: string;
  expectedConcepts?: string[];
}

export interface AnswerEvaluationInput {
  questionText: string;
  sampleAnswer?: string;
  userAnswer: string;
  category: string;
  targetSkill?: string;
  difficulty: InterviewDifficulty;
  intent?: QuestionIntent;
  expectedConcepts?: string[];
}

export interface AnswerEvaluationPayload {
  score: number; // 0-100
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  problemSolving: number;
  confidence: number;
  structure: number;
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  missingConcepts?: string[];
  nextFocus?: string;
  starMethodFollowed: boolean;
  starSituation: string | null;
  starTask: string | null;
  starAction: string | null;
  starResult: string | null;
  starCoachingFeedback: string | null;
}

export interface LLMCallMetrics {
  provider: string;
  model: string;
  operation: 'generateQuestion' | 'evaluateAnswer' | 'generateSummary';
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  fallbackUsed: boolean;
  success: boolean;
  error?: string;
}

export interface LLMResult<T> {
  data: T;
  metrics: LLMCallMetrics;
}

export interface SummaryGenerationInput {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  completedEvaluations: AnswerEvaluationPayload[];
  sessionTitle: string;
}

export interface SummaryGenerationPayload {
  overallFeedback: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendedPractice: string[];
}

export interface InterviewLLMProvider {
  name: string;
  generateQuestion(input: QuestionGenerationInput): Promise<LLMResult<GeneratedQuestionPayload>>;
  evaluateAnswer(input: AnswerEvaluationInput): Promise<LLMResult<AnswerEvaluationPayload>>;
  generateSummary(input: SummaryGenerationInput): Promise<LLMResult<SummaryGenerationPayload>>;
}

// Zod Schemas for Runtime Validation
export const GeneratedQuestionSchema = z.object({
  category: z.enum([
    'Technical',
    'Behavioral',
    'Resume-based',
    'Project-based',
    'Problem Solving',
    'Company Research',
    'Role-specific'
  ]).default('Technical'),
  text: z.string().min(10),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Very Hard']).default('Medium'),
  sampleAnswer: z.string().default(''),
  intent: z.enum([
    'resume_verification',
    'project_deep_dive',
    'skill_assessment',
    'weakness_probe',
    'job_requirement',
    'debugging',
    'system_design',
    'tradeoff_analysis',
    'scenario_based',
    'behavioral',
    'follow_up'
  ]).optional(),
  pattern: z.enum([
    'architectural_tradeoff',
    'failure_debugging',
    'code_internals',
    'real_world_scenario',
    'scaling_bottleneck',
    'security_resilience',
    'star_behavioral',
    'live_follow_up'
  ]).optional(),
  skill: z.string().optional(),
  topic: z.string().optional(),
  expectedConcepts: z.array(z.string()).default([]),
});

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  technicalAccuracy: z.number().min(0).max(100).default(70),
  communication: z.number().min(0).max(100).default(70),
  completeness: z.number().min(0).max(100).default(70),
  problemSolving: z.number().min(0).max(100).default(70),
  confidence: z.number().min(0).max(100).default(70),
  structure: z.number().min(0).max(100).default(70),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  improvedAnswer: z.string().default(''),
  missingConcepts: z.array(z.string()).default([]),
  nextFocus: z.string().optional(),
  starMethodFollowed: z.boolean().default(false),
  starSituation: z.string().nullable().default(null),
  starTask: z.string().nullable().default(null),
  starAction: z.string().nullable().default(null),
  starResult: z.string().nullable().default(null),
  starCoachingFeedback: z.string().nullable().default(null),
});

export const SummaryGenerationSchema = z.object({
  overallFeedback: z.string().min(10),
  keyStrengths: z.array(z.string()).default([]),
  keyWeaknesses: z.array(z.string()).default([]),
  recommendedPractice: z.array(z.string()).default([]),
});
