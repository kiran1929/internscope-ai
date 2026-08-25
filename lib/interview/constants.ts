export const INTERVIEW_LIMITS = {
  maxQuestions: 10,
  minQuestions: 1,
  defaultQuestions: 5,
  maxAnswerCharacters: 8000,
  maxFreeInterviewsPerDay: 2,
  maxResumeProjects: 3,
  maxResumeSkills: 12,
  maxTokensPerRequest: {
    questionGenerationInput: 2000,
    questionGenerationOutput: 300,
    answerEvaluationInput: 2500,
    answerEvaluationOutput: 400,
    summaryGenerationInput: 3000,
    summaryGenerationOutput: 600,
  },
} as const;
