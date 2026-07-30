import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIEvaluationPayload {
  score: number;
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  problemSolving: number;
  confidence: number;
  structure: number;
  
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  
  starMethodFollowed: boolean;
  starSituation: string | null;
  starTask: string | null;
  starAction: string | null;
  starResult: string | null;
  starCoachingFeedback: string | null;
}

export interface AIEvalResult {
  structuredData: AIEvaluationPayload;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export class AIEvalService {
  private static MODEL_NAME = 'gemini-1.5-flash';

  static async evaluate(params: {
    questionText: string;
    sampleAnswer: string;
    userAnswer: string;
    category: string;
  }): Promise<AIEvalResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;
    const isBehavioral = params.category.toLowerCase() === 'behavioral';

    let structuredData: AIEvaluationPayload;
    let provider = 'Mock-Local';
    let model = 'rules-engine';
    let tokensUsed = 0;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getPrompt(params.questionText, params.sampleAnswer, params.userAnswer, isBehavioral);
        
        const response = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.response.text();
        if (!text) throw new Error('Empty payload returned from Gemini evaluator');

        structuredData = JSON.parse(text);
        provider = 'Gemini';
        model = this.MODEL_NAME;

        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
      } catch (error) {
        console.error('Gemini answer evaluation failed, falling back to local mock evaluator:', error);
        structuredData = this.getMockEvaluation(params.userAnswer, isBehavioral);
      }
    } else {
      structuredData = this.getMockEvaluation(params.userAnswer, isBehavioral);
    }

    return {
      structuredData: this.sanitizeEvaluation(structuredData, isBehavioral),
      provider,
      model,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  private static sanitizeEvaluation(evalData: any, isBehavioral: boolean): AIEvaluationPayload {
    return {
      score: typeof evalData.score === 'number' ? evalData.score : 70,
      technicalAccuracy: typeof evalData.technicalAccuracy === 'number' ? evalData.technicalAccuracy : 70,
      communication: typeof evalData.communication === 'number' ? evalData.communication : 70,
      completeness: typeof evalData.completeness === 'number' ? evalData.completeness : 70,
      problemSolving: typeof evalData.problemSolving === 'number' ? evalData.problemSolving : 70,
      confidence: typeof evalData.confidence === 'number' ? evalData.confidence : 70,
      structure: typeof evalData.structure === 'number' ? evalData.structure : 70,
      
      strengths: Array.isArray(evalData.strengths) ? evalData.strengths.map(String) : ['Expressed clear ideas.'],
      weaknesses: Array.isArray(evalData.weaknesses) ? evalData.weaknesses.map(String) : ['Could include more technical details.'],
      improvedAnswer: evalData.improvedAnswer || 'A structured alternative explanation.',
      
      starMethodFollowed: typeof evalData.starMethodFollowed === 'boolean' ? evalData.starMethodFollowed : !isBehavioral,
      starSituation: isBehavioral ? (evalData.starSituation || null) : null,
      starTask: isBehavioral ? (evalData.starTask || null) : null,
      starAction: isBehavioral ? (evalData.starAction || null) : null,
      starResult: isBehavioral ? (evalData.starResult || null) : null,
      starCoachingFeedback: isBehavioral ? (evalData.starCoachingFeedback || null) : null,
    };
  }

  private static getMockEvaluation(userAnswer: string, isBehavioral: boolean): AIEvaluationPayload {
    const wordCount = userAnswer.split(/\s+/).filter(Boolean).length;
    
    // Simplistic grading rules
    let score = 65;
    if (wordCount > 30) score += 10;
    if (wordCount > 80) score += 10;
    if (userAnswer.toLowerCase().includes('result') || userAnswer.toLowerCase().includes('resolved')) score += 5;

    score = Math.min(score, 95);

    // STAR checks
    let starMethodFollowed = false;
    let starSituation = null;
    let starTask = null;
    let starAction = null;
    let starResult = null;
    let starCoachingFeedback = null;

    if (isBehavioral) {
      const hasSituation = userAnswer.toLowerCase().includes('when') || userAnswer.toLowerCase().includes('during');
      const hasAction = userAnswer.toLowerCase().includes('did') || userAnswer.toLowerCase().includes('built') || userAnswer.toLowerCase().includes('fixed');
      const hasResult = userAnswer.toLowerCase().includes('percent') || userAnswer.toLowerCase().includes('outcome') || userAnswer.toLowerCase().includes('result');
      
      starMethodFollowed = hasSituation && hasAction && hasResult;
      
      starSituation = 'You mentioned a general context/timeframe.';
      starTask = 'The core requirement/responsibility is implied.';
      starAction = 'You listed some steps you worked on.';
      starResult = hasResult ? 'You specified a positive resolution.' : 'Lacked measurable metrics.';
      
      if (!starMethodFollowed) {
        starCoachingFeedback = 'Your answer described a situation, but did not clearly outline the Actions you took or the quantitative Results. Rewrite your story to follow STAR explicitly.';
      } else {
        starCoachingFeedback = 'Good usage of contextual descriptions. Keep practicing adding exact metrics.';
      }
    }

    return {
      score,
      technicalAccuracy: score,
      communication: score + 5 > 100 ? 100 : score + 5,
      completeness: Math.max(score - 10, 40),
      problemSolving: score,
      confidence: score,
      structure: isBehavioral && !starMethodFollowed ? 50 : score,
      
      strengths: ['Addressed the core intent of the question.', 'Good communication flow.'],
      weaknesses: isBehavioral && !starMethodFollowed 
        ? ['Failed to structure your answer using Situation, Task, Action, and Result (STAR).'] 
        : ['Could expand on the technical rationale or architectural decisions.'],
      improvedAnswer: `To improve: Describe a specific situation, define the exact Task requirements, outline your direct Actions (e.g. "I refactored the database queries"), and state the measurable Result (e.g. "which reduced latency by 30%").`,
      
      starMethodFollowed,
      starSituation,
      starTask,
      starAction,
      starResult,
      starCoachingFeedback,
    };
  }

  private static getPrompt(question: string, sampleAnswer: string, userAnswer: string, isBehavioral: boolean): string {
    return `
You are an expert interviewer and STAR communication coach. Analyze the user's answer to this interview question and evaluate it.

Question:
"${question}"

Reference Guidelines / Expected Answer:
"${sampleAnswer}"

User's Submitted Answer:
"${userAnswer}"

Parameters:
- Category is Behavioral: ${isBehavioral ? 'YES' : 'NO'}. If Behavioral, you must check if they followed the STAR method (Situation, Task, Action, Result). If they did not follow STAR, provide a rewrited answer in STAR format, and explain how to apply STAR.

Return exactly a JSON object matching this schema:
{
  "score": 78,
  "technicalAccuracy": 80,
  "communication": 75,
  "completeness": 70,
  "problemSolving": 80,
  "confidence": 75,
  "structure": 78,
  
  "strengths": ["Clear explanation", "Accurate terms used"],
  "weaknesses": ["Missing outcome measurements", "Lacks structure"],
  "improvedAnswer": "A professional, high-scoring model rewrite of the candidate's answer.",
  
  "starMethodFollowed": true,
  "starSituation": "The Situation context of the story...",
  "starTask": "The specific Task or challenge they faced...",
  "starAction": "The explicit Actions they took...",
  "starResult": "The measurable Results achieved...",
  "starCoachingFeedback": "Actionable instructions explaining how the candidate can structure stories under STAR."
}
`;
  }
}
