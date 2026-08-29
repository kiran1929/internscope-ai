import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  InterviewLLMProvider,
  QuestionGenerationInput,
  GeneratedQuestionPayload,
  AnswerEvaluationInput,
  AnswerEvaluationPayload,
  SummaryGenerationInput,
  SummaryGenerationPayload,
  LLMResult,
  GeneratedQuestionSchema,
  AnswerEvaluationSchema,
  SummaryGenerationSchema,
} from './types';

import { AI_INTERVIEW_PROMPTS } from '../prompts';

export class GeminiProvider implements InterviewLLMProvider {
  name = 'Gemini';
  private static MODEL_NAME = 'gemini-1.5-flash';

  private getModel(systemInstruction?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
      model: GeminiProvider.MODEL_NAME,
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
    });
  }

  async generateQuestion(input: QuestionGenerationInput): Promise<LLMResult<GeneratedQuestionPayload>> {
    const startTime = Date.now();
    const model = this.getModel(AI_INTERVIEW_PROMPTS.questionGenerationSystem);

    const prompt = `
Candidate Resume Profile:
- Skills: ${input.candidateProfile.skills.slice(0, 10).join(', ')}
- Projects: ${input.candidateProfile.projects.map(p => `${p.name} (Tech: ${p.technologies.join(', ')}): ${p.description}`).join(' | ') || 'N/A'}
- Experience: ${input.candidateProfile.experience.map(e => `${e.role || 'Engineer'} at ${e.company || 'Tech'} (Tech: ${e.technologies.join(', ')})`).join(' | ') || 'N/A'}

${input.jobProfile ? `Target Role:
- Role: ${input.jobProfile.role} at ${input.jobProfile.company || 'Company'}
- Priority Skills: ${input.jobProfile.coreSkills.slice(0, 5).join(', ')}` : ''}

Target Skill: ${input.targetSkill}
Topic: ${input.topic}
Intent: ${input.intent}
Question Pattern Style: ${input.pattern || 'diverse_technical'}
Difficulty: ${input.difficulty}

${input.previousAnswerSummary ? `Previous Answer Summary:
- Topic: ${input.previousAnswerSummary.topic}
- Score: ${input.previousAnswerSummary.score}
- Weakness: ${input.previousAnswerSummary.weakness}
- Missing Concept: ${input.previousAnswerSummary.missingConcept}` : ''}

${input.recentQuestions && input.recentQuestions.length > 0 ? `CRITICAL - Already Asked Questions in this Session (DO NOT repeat or rephrase these):
${input.recentQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}` : ''}

Pattern Framing Directives:
${input.pattern === 'code_internals' ? '- Frame this as a deep internal implementation / mechanics question (e.g. How does the runtime/engine/protocol handle X under the hood? memory management, execution cycles, concurrency primitives).' : ''}
${input.pattern === 'scaling_bottleneck' ? '- Frame this as a high-traffic / scalability bottleneck scenario (e.g. Traffic jumps 100x; where is the first architectural breaking point, and how do you partition or cache to survive?).' : ''}
${input.pattern === 'failure_debugging' ? '- Frame this as a live production failure / outage scenario (e.g. Intermittent 504 gateway timeouts or connection leaks in production; walk me through your diagnostic triage steps and log tracing).' : ''}
${input.pattern === 'architectural_tradeoff' ? '- Frame this as an architectural design choice and trade-off comparison (e.g. Why choose X over alternative Y? What operational overhead or complexity did you accept?).' : ''}
${input.pattern === 'security_resilience' ? '- Frame this as a defensive security & data integrity challenge (e.g. How did you mitigate SQL/NoSQL injection, race conditions, or cache stampedes?).' : ''}
${input.pattern === 'star_behavioral' ? '- Frame this as a high-impact STAR behavioral question regarding technical disagreements, cross-team blockers, or incident retrospectives.' : ''}
${input.pattern === 'live_follow_up' ? '- Frame this as an in-depth follow-up to their previous answer, challenging a missed concept or an edge case constraint.' : ''}

Rules:
1. Ground strictly in the candidate's stated skills and projects. Do not invent technologies not present in resume.
2. Ask exactly ONE personalized question following the specific Pattern Framing Directive above.
3. Completely avoid generic questions (e.g., "What is Java?").
4. The question MUST BE structurally different and distinct in framing from all previous questions above.
5. Return JSON format:
{
  "category": "${input.intent === 'behavioral' ? 'Behavioral' : input.intent === 'project_deep_dive' ? 'Project-based' : input.intent === 'debugging' ? 'Problem Solving' : 'Technical'}",
  "text": "The question text",
  "difficulty": "${input.difficulty}",
  "sampleAnswer": "Key bullet points of an ideal structured response",
  "expectedConcepts": ["concept1", "concept2"]
}
`;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.response.text();
    if (!text) throw new Error('Empty payload returned from Gemini');

    const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;

    const parsed = JSON.parse(text);
    const validated = GeneratedQuestionSchema.parse({
      ...parsed,
      intent: input.intent,
      skill: input.targetSkill,
      topic: input.topic,
    });

    return {
      data: validated,
      metrics: {
        provider: this.name,
        model: GeminiProvider.MODEL_NAME,
        operation: 'generateQuestion',
        latencyMs: Date.now() - startTime,
        inputTokens: promptTokens,
        outputTokens: candidatesTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }

  async evaluateAnswer(input: AnswerEvaluationInput): Promise<LLMResult<AnswerEvaluationPayload>> {
    const startTime = Date.now();
    const model = this.getModel(AI_INTERVIEW_PROMPTS.answerEvaluationSystem);
    const isBehavioral = input.category.toLowerCase() === 'behavioral';

    const prompt = `
Question: "${input.questionText}"
Expected Guidelines / Concepts: "${input.sampleAnswer || 'N/A'}"
Candidate's Submitted Answer: "${input.userAnswer}"

Parameters:
- Category is Behavioral: ${isBehavioral ? 'YES' : 'NO'}.
- Target Skill: ${input.targetSkill || 'General'}
- Difficulty: ${input.difficulty}

STRICT EVALUATION CRITERIA:
1. Evaluate based on technical accuracy, required concepts, keywords, and completeness.
2. Do not inflate score for confidence or grammar.
3. Accept equivalent valid technical phrasing, but penalize vague buzzwords and missing mechanics.
4. Scale (0-100):
   - 0-29 = Incorrect / irrelevant
   - 30-49 = Very weak understanding
   - 50-69 = Partially correct (misses key security, internals, or trade-offs)
   - 70-89 = Good to very good understanding
   - 90-100 = Excellent and complete answer

Return exactly a JSON object:
{
  "score": 60,
  "technicalAccuracy": 60,
  "communication": 75,
  "completeness": 60,
  "problemSolving": 60,
  "confidence": 70,
  "structure": 70,
  "strengths": ["Identified basic usage of PreparedStatement for query execution"],
  "weaknesses": ["Did not explain parameterized query mechanism or SQL injection defense"],
  "improvedAnswer": "A concise model rewrite of the candidate's answer with full technical depth.",
  "missingConcepts": ["parameterized query", "SQL injection prevention"],
  "nextFocus": "Database security & query compilation",
  "starMethodFollowed": ${isBehavioral ? 'true' : 'false'},
  "starSituation": ${isBehavioral ? '"Situation"' : 'null'},
  "starTask": ${isBehavioral ? '"Task"' : 'null'},
  "starAction": ${isBehavioral ? '"Action"' : 'null'},
  "starResult": ${isBehavioral ? '"Result"' : 'null'},
  "starCoachingFeedback": ${isBehavioral ? '"STAR coaching notes"' : 'null'}
}
`;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.response.text();
    if (!text) throw new Error('Empty payload returned from Gemini evaluator');

    const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;

    const parsed = JSON.parse(text);
    const validated = AnswerEvaluationSchema.parse(parsed);

    return {
      data: validated,
      metrics: {
        provider: this.name,
        model: GeminiProvider.MODEL_NAME,
        operation: 'evaluateAnswer',
        latencyMs: Date.now() - startTime,
        inputTokens: promptTokens,
        outputTokens: candidatesTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }

  async generateSummary(input: SummaryGenerationInput): Promise<LLMResult<SummaryGenerationPayload>> {
    const startTime = Date.now();
    const model = this.getModel(AI_INTERVIEW_PROMPTS.summaryGenerationSystem);

    const prompt = `
Session: ${input.sessionTitle}
Scores: Overall ${input.overallScore}%, Tech Accuracy ${input.technicalScore}%, Communication ${input.communicationScore}%

Evaluations:
${input.completedEvaluations.map((e, idx) => `Q${idx + 1} (${e.score}%): Strengths: ${e.strengths.slice(0, 2).join(', ')} | Weaknesses: ${e.weaknesses.slice(0, 2).join(', ')} | Missing: ${(e.missingConcepts || []).slice(0, 2).join(', ')}`).join('\n')}

Synthesize the overall performance strictly. Avoid score or ability inflation.
Return JSON:
{
  "overallFeedback": "A concise paragraph summarizing performance and growth points.",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "keyWeaknesses": ["Weakness 1", "Weakness 2"],
  "recommendedPractice": ["Practice Topic 1", "Practice Topic 2"]
}
`;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.response.text();
    if (!text) throw new Error('Empty payload returned from Gemini summary');

    const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;

    const parsed = JSON.parse(text);
    const validated = SummaryGenerationSchema.parse(parsed);

    return {
      data: validated,
      metrics: {
        provider: this.name,
        model: GeminiProvider.MODEL_NAME,
        operation: 'generateSummary',
        latencyMs: Date.now() - startTime,
        inputTokens: promptTokens,
        outputTokens: candidatesTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }
}
