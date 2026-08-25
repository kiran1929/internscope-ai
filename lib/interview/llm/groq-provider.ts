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

export class GroqProvider implements InterviewLLMProvider {
  name = 'Groq';
  private static MODEL_NAME = 'openai/gpt-oss-120b';
  private static API_URL = 'https://api.groq.com/openai/v1/chat/completions';

  private getApiKey(): string {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    return key;
  }

  private async callGroq(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    const apiKey = this.getApiKey();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    try {
      const response = await fetch(GroqProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GroqProvider.MODEL_NAME,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Groq API error (${response.status}): ${errText}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response content from Groq');
      }

      const inputTokens = json.usage?.prompt_tokens || 0;
      const outputTokens = json.usage?.completion_tokens || 0;

      return { content, inputTokens, outputTokens };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async generateQuestion(input: QuestionGenerationInput): Promise<LLMResult<GeneratedQuestionPayload>> {
    const startTime = Date.now();
    const systemPrompt = `You are a senior technical interviewer. Generate exactly ONE interview question. Return JSON only.`;

    const userPrompt = `
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
1. Ask exactly ONE question that is completely distinct from all previously asked questions.
2. Return a JSON object matching this schema:
{
  "category": "${input.intent === 'behavioral' ? 'Behavioral' : input.intent === 'project_deep_dive' ? 'Project-based' : input.intent === 'debugging' ? 'Problem Solving' : 'Technical'}",
  "text": "The question text",
  "difficulty": "${input.difficulty}",
  "sampleAnswer": "Key bullet points for ideal response",
  "expectedConcepts": ["concept1", "concept2"]
}
3. If intent is 'resume_verification' or 'project_deep_dive', probe the candidate's exact project claims and architecture trade-offs.
4. If intent is 'behavioral', probe leadership, teamwork, or incident response using STAR storytelling.
5. For Hard / Very Hard difficulty, require concrete trade-offs, scalability, failure recovery, or architecture design.
6. Do not include extra conversational filler.
`;

    const { content, inputTokens, outputTokens } = await this.callGroq(systemPrompt, userPrompt, 350);
    const parsed = JSON.parse(content);
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
        model: GroqProvider.MODEL_NAME,
        operation: 'generateQuestion',
        latencyMs: Date.now() - startTime,
        inputTokens,
        outputTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }

  async evaluateAnswer(input: AnswerEvaluationInput): Promise<LLMResult<AnswerEvaluationPayload>> {
    const startTime = Date.now();
    const isBehavioral = input.category.toLowerCase() === 'behavioral';
    const systemPrompt = `You are a strict technical and behavioral interviewer. Evaluate the candidate's response. Penalize vague or unsubstantiated claims. Return JSON only.`;

    const userPrompt = `
Question: "${input.questionText}"
Candidate Answer: "${input.userAnswer}"
Category: ${input.category}
Target Skill: ${input.targetSkill || 'General'}
Difficulty: ${input.difficulty}

Expected Guidelines: ${input.sampleAnswer || 'N/A'}

Evaluate technical correctness, depth, reasoning, and completeness. Scores must be on a 0-100 scale.
${isBehavioral ? 'Analyze if the response follows the STAR method (Situation, Task, Action, Result).' : ''}

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
  "improvedAnswer": "Concise model answer illustrating how to address missing elements",
  "missingConcepts": ["concept A", "concept B"],
  "nextFocus": "Suggested follow-up concept",
  "starMethodFollowed": ${isBehavioral ? 'true' : 'false'},
  "starSituation": ${isBehavioral ? '"Situation context"' : 'null'},
  "starTask": ${isBehavioral ? '"Task context"' : 'null'},
  "starAction": ${isBehavioral ? '"Action taken"' : 'null'},
  "starResult": ${isBehavioral ? '"Measurable result"' : 'null'},
  "starCoachingFeedback": ${isBehavioral ? '"STAR coaching tips"' : 'null'}
}
`;

    const { content, inputTokens, outputTokens } = await this.callGroq(systemPrompt, userPrompt, 450);
    const parsed = JSON.parse(content);
    const validated = AnswerEvaluationSchema.parse(parsed);

    return {
      data: validated,
      metrics: {
        provider: this.name,
        model: GroqProvider.MODEL_NAME,
        operation: 'evaluateAnswer',
        latencyMs: Date.now() - startTime,
        inputTokens,
        outputTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }

  async generateSummary(input: SummaryGenerationInput): Promise<LLMResult<SummaryGenerationPayload>> {
    const startTime = Date.now();
    const systemPrompt = `You are an executive mock interviewer. Provide a comprehensive summary of candidate performance. Return JSON only.`;

    const userPrompt = `
Session: ${input.sessionTitle}
Overall Score: ${input.overallScore}%
Technical Score: ${input.technicalScore}%
Communication Score: ${input.communicationScore}%

Evaluated Answers Summary:
${input.completedEvaluations.map((e, idx) => `Q${idx + 1} (Score: ${e.score}%): Strengths: ${e.strengths.slice(0, 2).join(', ')} | Weaknesses: ${e.weaknesses.slice(0, 2).join(', ')}`).join('\n')}

Return JSON matching:
{
  "overallFeedback": "A 2-3 sentence executive summary of overall performance and core areas for growth.",
  "keyStrengths": ["Top strength 1", "Top strength 2", "Top strength 3"],
  "keyWeaknesses": ["Top weakness 1", "Top weakness 2", "Top weakness 3"],
  "recommendedPractice": ["Recommended practice area 1", "Recommended practice area 2", "Recommended practice area 3"]
}
`;

    const { content, inputTokens, outputTokens } = await this.callGroq(systemPrompt, userPrompt, 500);
    const parsed = JSON.parse(content);
    const validated = SummaryGenerationSchema.parse(parsed);

    return {
      data: validated,
      metrics: {
        provider: this.name,
        model: GroqProvider.MODEL_NAME,
        operation: 'generateSummary',
        latencyMs: Date.now() - startTime,
        inputTokens,
        outputTokens,
        fallbackUsed: false,
        success: true,
      },
    };
  }
}
