import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  analyzeATSKeywords,
  ATSKeywordAnalysis,
  buildCompactJobForPrompt,
  buildCompactResumeForPrompt,
} from './ats-keyword-engine';

export interface BulletRewriteItem {
  original: string;
  suggested: string;
  explanation: string;
}

export interface OptimizedSectionItem {
  sectionType: 'Summary' | 'Experience' | 'Projects' | 'Skills' | 'Education' | 'Certifications' | 'Achievements';
  originalContent: string;
  optimizedContent: string;
  bulletRewrites: BulletRewriteItem[];
}

export interface ATSAnalysisPayload {
  atsScore: number;
  keywordMatchScore: number;
  matchedKeywords?: string[];
  missingKeywords: string[];
  weakBullets: string[];
  strongBullets: string[];
  missingSkills: string[];
  suggestedProjects: string[];
  suggestedCertifications: string[];
  formattingIssues: string[];
  improvementChecklist: string[];
  sections: OptimizedSectionItem[];
}

export interface ATSAnalysisResult {
  structuredData: ATSAnalysisPayload;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export class AIOptimizeService {
  private static MODEL_NAME = 'gemini-1.5-flash';

  static async optimize(params: {
    resumeStructuredData: Record<string, unknown>;
    job?: {
      title?: string;
      description?: string | null;
      requirements?: string | null;
      company?: { name?: string };
    };
  }): Promise<ATSAnalysisResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    // Phase 1: deterministic keyword + bullet analysis (instant, accurate)
    const keywordAnalysis = analyzeATSKeywords(params.resumeStructuredData, params.job);

    let structuredData: ATSAnalysisPayload;
    let provider = 'RulesEngine';
    let model = 'ats-keyword-engine';
    let tokensUsed = 0;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getRewritePrompt(
          params.resumeStructuredData,
          params.job,
          keywordAnalysis
        );

        const response = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 2048,
          },
        });

        const text = response.response.text();
        if (!text) throw new Error('Empty payload returned from Gemini optimizer');

        const llmData = JSON.parse(text);
        structuredData = this.mergeWithKeywordAnalysis(llmData, keywordAnalysis, params.resumeStructuredData);
        provider = 'Gemini+RulesEngine';
        model = this.MODEL_NAME;

        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
      } catch (error) {
        console.error('Gemini ATS rewrite failed, using rules-only optimization:', error);
        structuredData = this.buildFromKeywordAnalysis(keywordAnalysis, params.resumeStructuredData, params.job);
        provider = 'RulesEngine';
        model = 'ats-keyword-engine';
      }
    } else {
      structuredData = this.buildFromKeywordAnalysis(keywordAnalysis, params.resumeStructuredData, params.job);
    }

    return {
      structuredData: this.sanitizeOptimization(structuredData, params.resumeStructuredData),
      provider,
      model,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  private static mergeWithKeywordAnalysis(
    llmData: Record<string, unknown>,
    keywordAnalysis: ATSKeywordAnalysis,
    resume: Record<string, unknown>
  ): ATSAnalysisPayload {
    const base = this.buildFromKeywordAnalysis(keywordAnalysis, resume);

    return {
      ...base,
      // Keep deterministic scores — LLM often inflates these
      atsScore: keywordAnalysis.atsScore,
      keywordMatchScore: keywordAnalysis.keywordMatchScore,
      missingKeywords: keywordAnalysis.missingKeywords,
      weakBullets: keywordAnalysis.weakBullets,
      strongBullets: keywordAnalysis.strongBullets,
      missingSkills: keywordAnalysis.missingSkills.length > 0
        ? keywordAnalysis.missingSkills
        : (Array.isArray(llmData.missingSkills) ? llmData.missingSkills as string[] : base.missingSkills),
      suggestedProjects: Array.isArray(llmData.suggestedProjects)
        ? (llmData.suggestedProjects as string[]).slice(0, 3)
        : base.suggestedProjects,
      suggestedCertifications: Array.isArray(llmData.suggestedCertifications)
        ? (llmData.suggestedCertifications as string[]).slice(0, 3)
        : base.suggestedCertifications,
      formattingIssues: keywordAnalysis.formattingIssues,
      improvementChecklist: Array.from(new Set([
        ...keywordAnalysis.improvementChecklist,
        ...(Array.isArray(llmData.improvementChecklist) ? llmData.improvementChecklist as string[] : []),
      ])).slice(0, 6),
      sections: Array.isArray(llmData.sections) && (llmData.sections as unknown[]).length > 0
        ? (llmData.sections as Record<string, unknown>[]).map((s) => ({
            sectionType: (s.sectionType as OptimizedSectionItem['sectionType']) || 'Experience',
            originalContent: String(s.originalContent || ''),
            optimizedContent: String(s.optimizedContent || ''),
            bulletRewrites: Array.isArray(s.bulletRewrites)
              ? (s.bulletRewrites as Record<string, string>[]).map((br) => ({
                  original: br.original || '',
                  suggested: br.suggested || '',
                  explanation: br.explanation || '',
                }))
              : [],
          }))
        : base.sections,
    };
  }

  private static buildFromKeywordAnalysis(
    analysis: ATSKeywordAnalysis,
    resume: Record<string, unknown>,
    job?: { title?: string }
  ): ATSAnalysisPayload {
    const originalSummary = String(resume.summary || 'Software engineering professional.');
    const originalSkills = Array.isArray(resume.skills) ? (resume.skills as string[]).join(', ') : '';
    const addedKeywords = analysis.missingKeywords.slice(0, 5).join(', ');

    const experienceBullets = (Array.isArray(resume.experience) ? resume.experience as Record<string, unknown>[] : [])
      .flatMap((e) => (Array.isArray(e.bullets) ? e.bullets as string[] : []))
      .slice(0, 3);

    const bulletRewrites = analysis.weakBullets.slice(0, 3).map((weak) => ({
      original: weak,
      suggested: weak
        .replace(/^(helped|worked on|responsible for|assisted with)\s+/i, 'Engineered ')
        .replace(/\.$/, '') + ' — add a quantified metric (e.g. 30% improvement, 10K users).',
      explanation: 'Replace passive phrasing with an action verb and add a measurable result.',
    }));

    return {
      atsScore: analysis.atsScore,
      keywordMatchScore: analysis.keywordMatchScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      weakBullets: analysis.weakBullets,
      strongBullets: analysis.strongBullets,
      missingSkills: analysis.missingSkills,
      suggestedProjects: analysis.missingKeywords.length > 0
        ? [`Build a portfolio project demonstrating ${analysis.missingKeywords.slice(0, 2).join(' and ')}.`]
        : [],
      suggestedCertifications: [],
      formattingIssues: analysis.formattingIssues,
      improvementChecklist: analysis.improvementChecklist,
      sections: [
        {
          sectionType: 'Summary',
          originalContent: originalSummary,
          optimizedContent: addedKeywords
            ? `${originalSummary} Proficient in ${addedKeywords}.`
            : originalSummary,
          bulletRewrites: [],
        },
        {
          sectionType: 'Skills',
          originalContent: originalSkills,
          optimizedContent: addedKeywords
            ? `${originalSkills}${originalSkills ? ', ' : ''}${addedKeywords}`
            : originalSkills,
          bulletRewrites: [],
        },
        {
          sectionType: 'Experience',
          originalContent: experienceBullets.join('\n') || 'Experience bullets',
          optimizedContent: experienceBullets.join('\n') || 'Experience bullets',
          bulletRewrites,
        },
      ],
    };
  }

  private static sanitizeOptimization(data: ATSAnalysisPayload, originalResume: Record<string, unknown>): ATSAnalysisPayload {
    return {
      atsScore: typeof data.atsScore === 'number' ? Math.min(100, Math.max(0, data.atsScore)) : 70,
      keywordMatchScore: typeof data.keywordMatchScore === 'number' ? Math.min(100, Math.max(0, data.keywordMatchScore)) : 65,
      matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords.map(String) : [],
      missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.map(String) : [],
      weakBullets: Array.isArray(data.weakBullets) ? data.weakBullets.map(String) : [],
      strongBullets: Array.isArray(data.strongBullets) ? data.strongBullets.map(String) : [],
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills.map(String) : [],
      suggestedProjects: Array.isArray(data.suggestedProjects) ? data.suggestedProjects.map(String) : [],
      suggestedCertifications: Array.isArray(data.suggestedCertifications) ? data.suggestedCertifications.map(String) : [],
      formattingIssues: Array.isArray(data.formattingIssues) ? data.formattingIssues.map(String) : [],
      improvementChecklist: Array.isArray(data.improvementChecklist) && data.improvementChecklist.length > 0
        ? data.improvementChecklist.map(String)
        : ['Rewrite experience bullet points with quantitative results'],
      sections: Array.isArray(data.sections) ? data.sections.map((s) => ({
        sectionType: s.sectionType || 'Experience',
        originalContent: s.originalContent || '',
        optimizedContent: s.optimizedContent || '',
        bulletRewrites: Array.isArray(s.bulletRewrites) ? s.bulletRewrites.map((br) => ({
          original: br.original || '',
          suggested: br.suggested || '',
          explanation: br.explanation || '',
        })) : [],
      })) : [],
    };
  }

  /** Focused LLM prompt — scores come from rules engine; LLM only rewrites. */
  private static getRewritePrompt(
    resume: Record<string, unknown>,
    job: {
      title?: string;
      description?: string | null;
      requirements?: string | null;
      company?: { name?: string };
    } | undefined,
    analysis: ATSKeywordAnalysis
  ): string {
    const compactResume = buildCompactResumeForPrompt(resume);
    const compactJob = buildCompactJobForPrompt(job);

    return `
You are an ATS resume optimization expert. Keyword analysis is ALREADY COMPLETE — do NOT re-score.

Pre-computed ATS Analysis:
- ATS Score: ${analysis.atsScore}%
- Keyword Match: ${analysis.keywordMatchScore}%
- Matched Keywords: ${analysis.matchedKeywords.join(', ') || 'None'}
- Missing Keywords: ${analysis.missingKeywords.join(', ') || 'None'}
- Weak Bullets: ${analysis.weakBullets.slice(0, 3).join(' | ') || 'None'}
- Formatting Issues: ${analysis.formattingIssues.join('; ') || 'None'}

Target Job:
${JSON.stringify(compactJob || { title: 'General Software Engineer' })}

Candidate Resume (compact):
${JSON.stringify(compactResume)}

Your task — return ONLY section rewrites and suggestions:
1. Rewrite Summary and Skills to naturally include missing keywords: ${analysis.missingKeywords.slice(0, 5).join(', ') || 'N/A'}
2. Provide bullet rewrites for weak bullets using action verbs + metrics
3. Suggest 1-2 portfolio projects and 0-2 certifications if relevant
4. Add 2-3 improvement checklist items beyond the pre-computed ones

Return JSON:
{
  "suggestedProjects": ["project idea"],
  "suggestedCertifications": ["cert if relevant"],
  "improvementChecklist": ["action item"],
  "sections": [
    {
      "sectionType": "Summary",
      "originalContent": "...",
      "optimizedContent": "...",
      "bulletRewrites": []
    },
    {
      "sectionType": "Skills",
      "originalContent": "...",
      "optimizedContent": "...",
      "bulletRewrites": []
    },
    {
      "sectionType": "Experience",
      "originalContent": "...",
      "optimizedContent": "...",
      "bulletRewrites": [
        { "original": "...", "suggested": "...", "explanation": "..." }
      ]
    }
  ]
}
`;
  }
}
