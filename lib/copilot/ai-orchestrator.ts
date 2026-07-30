import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIOrchestratorResult {
  text: string;
  provider: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
  latencyMs: number;
}

export class AIOrchestrator {
  private static DEFAULT_PROVIDER = 'Gemini';
  private static DEFAULT_MODEL = 'gemini-1.5-flash';

  static async generate(params: {
    systemInstruction?: string;
    prompt: string;
    chatHistory?: Array<{ role: 'user' | 'model'; parts: { text: string }[] }>;
    responseMimeType?: string;
  }): Promise<AIOrchestratorResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    let text = '';
    let tokensUsed = 0;
    let estimatedCost = 0.0;
    let provider = this.DEFAULT_PROVIDER;
    let modelName = this.DEFAULT_MODEL;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: params.systemInstruction,
        });

        let response;
        if (params.chatHistory && params.chatHistory.length > 0) {
          const chat = model.startChat({
            history: params.chatHistory,
            generationConfig: params.responseMimeType ? { responseMimeType: params.responseMimeType } : undefined,
          });
          response = await chat.sendMessage(params.prompt);
        } else {
          response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
            generationConfig: params.responseMimeType ? { responseMimeType: params.responseMimeType } : undefined,
          });
        }

        text = response.response.text() || '';
        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
        
        // Cost index: $0.075 / 1M input tokens, $0.3 / 1M output tokens
        estimatedCost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);
      } catch (error) {
        console.error('AIOrchestrator: Gemini call failed, falling back to local mocks:', error);
        text = this.getLocalMockResponse(params.prompt);
        provider = 'Mock-Local';
        modelName = 'rules-engine';
      }
    } else {
      text = this.getLocalMockResponse(params.prompt);
      provider = 'Mock-Local';
      modelName = 'rules-engine';
    }

    return {
      text: text.trim(),
      provider,
      model: modelName,
      tokensUsed,
      estimatedCost,
      latencyMs: Date.now() - startTime,
    };
  }

  private static getLocalMockResponse(prompt: string): string {
    const pLower = prompt.toLowerCase();
    
    if (pLower.includes('why is my match score') || pLower.includes('score')) {
      return `Based on your profile data, your match score is calculated using your resume skills overlap, job requirements density, and matching experiences. You are missing key tools (like Docker and CI/CD) required by the target job description. Add these to your resume to increase alignment.`;
    }
    if (pLower.includes('project') || pLower.includes('highlight')) {
      return `I recommend highlighting your "InternScope AI Ingestion Pipeline" project. This showcases systems design, background queues (Trigger.dev), and full-stack API integration (React, Next.js, and Prisma), matching what top modern web startups look for.`;
    }
    if (pLower.includes('improve my resume') || pLower.includes('resume')) {
      return `To improve your resume:
1. Align your Experience section bullets using quantified outcomes (e.g. "reduced latency by 35%").
2. Insert target keywords (like Kubernetes and GraphQL) that the ATS Analyzer identified as missing.
3. Review spelling and spacing issues using the ATS formatting checker.`;
    }
    if (pLower.includes('learn') || pLower.includes('what should i learn')) {
      return `This week, focus on completing the **Docker & Containerization** roadmap. This will address the largest missing skill gap identified across your matching job opportunities.`;
    }
    if (pLower.includes('companies')) {
      return `Based on your full stack Node/React profile, startups using TypeScript and Postgres (like Supabase or Vercel matches) would fit your skillset best. Review your saved list in InternScope to launch practice mock sessions.`;
    }

    return `I am your AI Career Copilot. I can help you analyze your resume optimization details, plan mock interview practices, structure STAR behavioral stories, or review missing skills from your learning roadmaps. How can I help you improve today?`;
  }
}
