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

export class GeminiProvider implements InterviewLLMProvider {
  name = 'Gemini';
  private static MODEL_NAME = 'gemini-1.5-flash';

  private getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: GeminiProvider.MODEL_NAME });
  }

  async generateQuestion(input: QuestionGenerationInput): Promise<LLMResult<GeneratedQuestionPayload>> {
    const startTime = Date.now();
    const model = this.getModel();

    const prompt = `
You are an expert, insightful technical and behavioral interviewer. Generate exactly ONE interview question. Return JSON only.

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
Difficulty: ${input.difficulty}

${input.previousAnswerSummary ? `Previous Answer Summary:
- Topic: ${input.previousAnswerSummary.topic}
- Score: ${input.previousAnswerSummary.score}
- Weakness: ${input.previousAnswerSummary.weakness}
- Missing Concept: ${input.previousAnswerSummary.missingConcept}` : ''}

${input.recentQuestions && input.recentQuestions.length > 0 ? `CRITICAL - Already Asked Questions in this Session (DO NOT repeat or rephrase these):
${input.recentQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}` : ''}

Rules:
1. The question MUST BE completely novel and different from all previously asked questions above.
2. If intent is 'project_deep_dive', ask specifically about the candidate's architecture, implementation choices, and trade-offs in their project.
3. If intent is 'behavioral', ask a high-impact STAR question about teamwork, conflict, or incident response.
4. If intent is 'job_requirement' or 'skill_assessment', ask a deep technical scenario exploring scalability, trade-offs, and edge cases.
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
    const model = this.getModel();
    const isBehavioral = input.category.toLowerCase() === 'behavioral';

    const prompt = `
You are an expert technical interviewer and STAR communication coach. Analyze the user's answer and evaluate it strictly.

Question: "${input.questionText}"
Expected Guidelines: "${input.sampleAnswer || 'N/A'}"
User's Submitted Answer: "${input.userAnswer}"

Parameters:
- Category is Behavioral: ${isBehavioral ? 'YES' : 'NO'}.
- Target Skill: ${input.targetSkill || 'General'}
- Difficulty: ${input.difficulty}

Return exactly a JSON object:
{
  "score": 75,
  "technicalAccuracy": 75,
  "communication": 80,
  "completeness": 70,
  "problemSolving": 75,
  "confidence": 75,
  "structure": 75,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "improvedAnswer": "A concise model rewrite of the candidate's answer.",
  "missingConcepts": ["concept1"],
  "nextFocus": "Next topic",
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
    const model = this.getModel();

    const prompt = `
You are an executive mock interviewer. Summarize candidate performance across these evaluated answers.
Session: ${input.sessionTitle}
Scores: Overall ${input.overallScore}%, Tech Accuracy ${input.technicalScore}%, Communication ${input.communicationScore}%

Evaluations:
${input.completedEvaluations.map((e, idx) => `Q${idx + 1} (${e.score}%): Strengths: ${e.strengths.slice(0, 2).join(', ')} | Weaknesses: ${e.weaknesses.slice(0, 2).join(', ')}`).join('\n')}

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
