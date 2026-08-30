import { GroqProvider } from './groq-provider';
import { GeminiProvider } from './gemini-provider';
import {
  InterviewLLMProvider,
  QuestionGenerationInput,
  GeneratedQuestionPayload,
  AnswerEvaluationInput,
  AnswerEvaluationPayload,
  SummaryGenerationInput,
  SummaryGenerationPayload,
  LLMResult,
  LLMCallMetrics,
} from './types';
import { normalizeQuestionText } from '../question-meta';

export class LLMRouter implements InterviewLLMProvider {
  name = 'LLMRouter';
  private groqProvider: GroqProvider;
  private geminiProvider: GeminiProvider;

  constructor() {
    this.groqProvider = new GroqProvider();
    this.geminiProvider = new GeminiProvider();
  }

  private logMetric(metric: LLMCallMetrics) {
    // Non-sensitive logging of token analytics and latency
    console.info(`[LLMRouter] ${metric.operation} | Provider: ${metric.provider} (${metric.model}) | InTokens: ${metric.inputTokens} | OutTokens: ${metric.outputTokens} | Latency: ${metric.latencyMs}ms | Fallback: ${metric.fallbackUsed}`);
  }

  async generateQuestion(input: QuestionGenerationInput): Promise<LLMResult<GeneratedQuestionPayload>> {
    // Try Primary (Groq) with up to 1 retry
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (hasGroq) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await this.groqProvider.generateQuestion(input);
          this.logMetric(result.metrics);
          return result;
        } catch (err: unknown) {
          console.warn(`[LLMRouter] Groq question attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 400)); // small backoff before single retry
          }
        }
      }
    }

    // Fallback to Gemini
    const hasGemini = !!process.env.GEMINI_API_KEY;
    if (hasGemini) {
      try {
        console.info('[LLMRouter] Routing question generation to fallback provider (Gemini)...');
        const result = await this.geminiProvider.generateQuestion(input);
        result.metrics.fallbackUsed = true;
        this.logMetric(result.metrics);
        return result;
      } catch (geminiError) {
        console.error('[LLMRouter] Fallback Gemini question generation also failed:', geminiError);
      }
    }

    // Deterministic Mock Rule Fallback for offline/local resilience
    console.warn('[LLMRouter] Both providers unavailable. Returning structured mock fallback question.');
    return this.getMockQuestion(input);
  }

  async evaluateAnswer(input: AnswerEvaluationInput): Promise<LLMResult<AnswerEvaluationPayload>> {
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (hasGroq) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await this.groqProvider.evaluateAnswer(input);
          this.logMetric(result.metrics);
          return result;
        } catch (err: unknown) {
          console.warn(`[LLMRouter] Groq evaluation attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
    }

    const hasGemini = !!process.env.GEMINI_API_KEY;
    if (hasGemini) {
      try {
        console.info('[LLMRouter] Routing evaluation to fallback provider (Gemini)...');
        const result = await this.geminiProvider.evaluateAnswer(input);
        result.metrics.fallbackUsed = true;
        this.logMetric(result.metrics);
        return result;
      } catch (geminiError) {
        console.error('[LLMRouter] Fallback Gemini answer evaluation also failed:', geminiError);
      }
    }

    console.warn('[LLMRouter] Both providers unavailable. Using local heuristic evaluation.');
    return this.getMockEvaluation(input);
  }

  async generateSummary(input: SummaryGenerationInput): Promise<LLMResult<SummaryGenerationPayload>> {
    const hasGroq = !!process.env.GROQ_API_KEY;
    if (hasGroq) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await this.groqProvider.generateSummary(input);
          this.logMetric(result.metrics);
          return result;
        } catch (err) {
          console.warn(`[LLMRouter] Groq summary attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
    }

    const hasGemini = !!process.env.GEMINI_API_KEY;
    if (hasGemini) {
      try {
        console.info('[LLMRouter] Routing summary to fallback provider (Gemini)...');
        const result = await this.geminiProvider.generateSummary(input);
        result.metrics.fallbackUsed = true;
        this.logMetric(result.metrics);
        return result;
      } catch (geminiError) {
        console.error('[LLMRouter] Fallback Gemini summary generation also failed:', geminiError);
      }
    }

    return this.getMockSummary(input);
  }

  // --- Local Fallbacks for Zero-Downtime Guarantee ---
  private getMockQuestion(input: QuestionGenerationInput): LLMResult<GeneratedQuestionPayload> {
    const skill = input.targetSkill || 'Software Engineering';
    const topic = input.topic || 'System Design';
    const recent = new Set((input.recentQuestions || []).map(q => q.toLowerCase().trim()));

    let text = '';
    let category: 'Technical' | 'Behavioral' | 'Resume-based' | 'Project-based' | 'Problem Solving' = 'Technical';

    if (input.pattern === 'code_internals') {
      category = 'Technical';
      text = `In ${skill}, how does the underlying engine or runtime manage internal execution, state lifecycle, and memory allocation when processing ${topic}?`;
    } else if (input.pattern === 'scaling_bottleneck') {
      category = 'Technical';
      text = `Imagine your ${skill} service suddenly receives a 50x spike in concurrent requests. Which component or layer becomes the primary bottleneck, and what is your mitigation strategy?`;
    } else if (input.pattern === 'failure_debugging') {
      category = 'Problem Solving';
      text = `Suppose you encounter sudden connection timeouts or resource starvation in your ${skill} stack during production peak hours. Walk me through your step-by-step diagnostic runbook.`;
    } else if (input.pattern === 'architectural_tradeoff') {
      category = 'Technical';
      text = `When architecting with ${skill} for ${topic}, what alternatives did you evaluate, and what specific engineering trade-offs or operational costs did you accept?`;
    } else if (input.pattern === 'security_resilience') {
      category = 'Technical';
      text = `What defensive programming practices, sanitization, or concurrency control mechanisms do you enforce in ${skill} to prevent race conditions and data corruption?`;
    } else if (input.intent === 'resume_verification') {
      category = 'Resume-based';
      const matchedProj = input.candidateProfile.projects.find(p => topic.toLowerCase().includes(p.name.toLowerCase()))
        || input.candidateProfile.projects.find(p => !recent.has(p.name.toLowerCase()))
        || input.candidateProfile.projects[0];

      if (matchedProj) {
        const techs = matchedProj.technologies.slice(0, 3).join(', ') || skill;
        const variants = [
          `Your resume mentions "${matchedProj.name}" built with ${techs}. Walk me through your specific contribution and one technical decision you made.`,
          `On "${matchedProj.name}", what was the hardest technical problem you personally solved, and how did you validate your solution?`,
          `How would you defend the architecture choices in "${matchedProj.name}" if challenged in a technical review?`,
        ];
        text = variants.find(q => !recent.has(normalizeQuestionText(q))) || variants[0];
      } else {
        text = `Pick one project from your resume and explain your personal contribution versus the team's work.`;
      }
    } else if (input.pattern === 'star_behavioral' || input.intent === 'behavioral') {
      category = 'Behavioral';
      const behavioralQuestions = [
        `Tell me about a time you faced a high-stakes technical disagreement on architecture or coding standards with a teammate. How did you resolve it?`,
        `Describe a challenging production incident or critical bug you encountered in a previous project. What was your step-by-step troubleshooting process and how did you prevent recurrence?`,
        `Give an example of a project where requirements changed midway through development. How did you adapt your timeline and engineering deliverables?`,
      ];
      text = behavioralQuestions.find(q => !recent.has(q.toLowerCase())) || behavioralQuestions[0];
    } else if (input.pattern === 'live_follow_up') {
      category = 'Technical';
      text = `Following up on your explanation of ${skill}: what happens if network latency increases or upstream dependencies fail while handling ${topic}?`;
    } else if (input.intent === 'project_deep_dive') {
      category = 'Project-based';
      const matchedProj = input.candidateProfile.projects.find(p => topic.toLowerCase().includes(p.name.toLowerCase()))
        || input.candidateProfile.projects.find(p => !recent.has(p.name.toLowerCase()))
        || input.candidateProfile.projects[0];

      if (matchedProj) {
        const techs = matchedProj.technologies.slice(0, 3).join(', ') || skill;
        text = `In "${matchedProj.name}" built with ${techs}, how did you handle state transitions and consistency across service boundaries?`;
      } else {
        text = `Can you walk me through the architecture of a major system you built with ${skill}? What technical challenges did you encounter and how did you resolve them?`;
      }
    } else {
      category = 'Technical';
      text = `Walk me through how you optimize ${skill} applications when dealing with ${topic}. What specific tradeoffs and performance metrics do you monitor?`;
    }

    return {
      data: {
        category,
        text,
        difficulty: input.difficulty,
        sampleAnswer: `Detail architecture patterns, algorithmic choices, trade-offs, and practical lessons from building with ${skill}.`,
        intent: input.intent,
        skill: input.targetSkill,
        topic: input.topic,
        expectedConcepts: [skill, topic, 'tradeoffs'],
      },
      metrics: {
        provider: 'MockLocal',
        model: 'rules-engine',
        operation: 'generateQuestion',
        latencyMs: 1,
        inputTokens: 0,
        outputTokens: 0,
        fallbackUsed: true,
        success: true,
      },
    };
  }

  private getMockEvaluation(input: AnswerEvaluationInput): LLMResult<AnswerEvaluationPayload> {
    const words = input.userAnswer.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    let score = 70;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const questionTokens = input.questionText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const answerLower = input.userAnswer.toLowerCase();
    const conceptHits = (input.expectedConcepts || []).filter((c) =>
      answerLower.includes(c.toLowerCase())
    );
    const questionKeywordHits = questionTokens.filter((t) => answerLower.includes(t)).length;
    const relevanceRatio = questionTokens.length > 0 ? questionKeywordHits / questionTokens.length : 0;

    if (wordCount < 15) {
      score = 45;
      weaknesses.push('Response is very brief relative to what the question asked.');
    } else if (relevanceRatio < 0.15 && conceptHits.length === 0) {
      score = 35;
      weaknesses.push('Answer does not appear to address the specific question or expected concepts.');
    } else if (conceptHits.length >= 2 || relevanceRatio >= 0.35) {
      score = wordCount > 60 ? 85 : 78;
      strengths.push('Answer engages with key concepts from the question.');
    } else {
      score = 62;
      weaknesses.push('Partially addresses the question but misses several expected concepts.');
    }

    const isBehavioral = input.category.toLowerCase() === 'behavioral' || input.intent === 'behavioral';
    const hasSituation = input.userAnswer.toLowerCase().includes('when') || input.userAnswer.toLowerCase().includes('project');
    const hasAction = input.userAnswer.toLowerCase().includes('implemented') || input.userAnswer.toLowerCase().includes('built') || input.userAnswer.toLowerCase().includes('solved');
    const starMethodFollowed = isBehavioral ? (hasSituation && hasAction) : true;

    const missingConcepts = (input.expectedConcepts || []).filter(
      (c) => !answerLower.includes(c.toLowerCase())
    ).slice(0, 3);

    return {
      data: {
        score,
        technicalAccuracy: score,
        communication: Math.min(score + 5, 100),
        completeness: Math.max(score - 5, 40),
        problemSolving: score,
        confidence: score,
        structure: starMethodFollowed ? score : 55,
        strengths,
        weaknesses,
        improvedAnswer: isBehavioral
          ? 'Structure your story explicitly with Situation, Task, Action, and measurable Result (STAR).'
          : `Expand on how your answer directly addresses: "${input.questionText.slice(0, 120)}…"`,
        missingConcepts: missingConcepts.length > 0 ? missingConcepts : ['trade-off analysis'],
        nextFocus: input.targetSkill || input.expectedConcepts?.[0] || 'core concepts',
        starMethodFollowed,
        starSituation: isBehavioral ? (hasSituation ? 'Identified context.' : 'Context could be clearer.') : null,
        starTask: isBehavioral ? 'Core task implied.' : null,
        starAction: isBehavioral ? (hasAction ? 'Detailed action taken.' : 'Specify exact action steps.') : null,
        starResult: isBehavioral ? 'Quantify final impact.' : null,
        starCoachingFeedback: isBehavioral && !starMethodFollowed ? 'Use the STAR framework explicitly to communicate engineering impact.' : null,
      },
      metrics: {
        provider: 'MockLocal',
        model: 'rules-engine',
        operation: 'evaluateAnswer',
        latencyMs: 1,
        inputTokens: 0,
        outputTokens: 0,
        fallbackUsed: true,
        success: true,
      },
    };
  }

  private getMockSummary(input: SummaryGenerationInput): LLMResult<SummaryGenerationPayload> {
    const strengths = Array.from(new Set(input.completedEvaluations.flatMap((e) => e.strengths))).slice(0, 3);
    const weaknesses = Array.from(new Set(input.completedEvaluations.flatMap((e) => e.weaknesses))).slice(0, 3);

    return {
      data: {
        overallFeedback: `Completed mock interview "${input.sessionTitle}" with an overall performance score of ${input.overallScore}%. Technical accuracy is at ${input.technicalScore}%. Continue practicing trade-off analyses and STAR storytelling.`,
        keyStrengths: strengths.length > 0 ? strengths : ['Solid technical vocabulary', 'Direct communication style'],
        keyWeaknesses: weaknesses.length > 0 ? weaknesses : ['Expand on failure handling', 'Include concrete performance metrics'],
        recommendedPractice: ['System architecture trade-offs', 'STAR behavioral storytelling', 'Database indexing & query planning'],
      },
      metrics: {
        provider: 'MockLocal',
        model: 'rules-engine',
        operation: 'generateSummary',
        latencyMs: 1,
        inputTokens: 0,
        outputTokens: 0,
        fallbackUsed: true,
        success: true,
      },
    };
  }
}

export const llmRouter = new LLMRouter();
