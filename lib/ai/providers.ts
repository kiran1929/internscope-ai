import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, ENRICH_USER_PROMPT } from './prompts';

export interface AIEnrichmentResult {
  skills: string[];
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    cloud?: string[];
    devops?: string[];
    mobile?: string[];
    ai?: string[];
    dataEngineering?: string[];
  };
  experienceLevel: 'Intern' | 'Entry Level' | 'Junior' | 'Mid Level' | 'Senior' | 'Lead' | 'Manager';
  employmentType: 'Internship' | 'Full-Time' | 'Part-Time' | 'Contract' | 'Freelance';
  remoteType: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: 'HOURLY' | 'MONTHLY' | 'ANNUAL' | null;
  tags: string[];
  qualityScore: number;
  reasoning: string;
  tokensUsed: number;
  estimatedCost: number;
}

export interface AIProvider {
  name: string;
  modelName: string;
  enrich(title: string, location: string, description: string): Promise<AIEnrichmentResult>;
}

// 1. Google Gemini Provider
export class GeminiAIProvider implements AIProvider {
  public readonly name = 'Gemini';
  public readonly modelName = 'gemini-1.5-flash';
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async enrich(title: string, location: string, description: string): Promise<AIEnrichmentResult> {
    const prompt = ENRICH_USER_PROMPT(title, location, description);
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }, { text: prompt }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.response.text();
    if (!text) {
      throw new Error('Gemini API returned empty content');
    }

    const payload = JSON.parse(text);

    // Estimate costs (based on average input/output tokens)
    const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = promptTokens + candidatesTokens;
    // Costs: $0.075 per 1M input tokens, $0.30 per 1M output tokens (approx for gemini-1.5-flash)
    const cost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);

    return {
      skills: Array.isArray(payload.skills) ? payload.skills : [],
      techStack: payload.techStack || {},
      experienceLevel: payload.experienceLevel || 'Entry Level',
      employmentType: payload.employmentType || 'Full-Time',
      remoteType: payload.remoteType || 'Unknown',
      salaryMin: payload.salaryMin ?? null,
      salaryMax: payload.salaryMax ?? null,
      salaryCurrency: payload.salaryCurrency ?? null,
      salaryPeriod: payload.salaryPeriod ?? null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      qualityScore: payload.qualityScore ?? 0.85,
      reasoning: payload.reasoning || 'Extracted using Gemini 1.5 Flash.',
      tokensUsed: totalTokens,
      estimatedCost: Math.round(cost * 100000) / 100000,
    };
  }
}

// 2. Mock Fallback Provider (Rule-Based Parsing Engine)
export class MockAIProvider implements AIProvider {
  public readonly name = 'Mock-AI';
  public readonly modelName = 'local-rules-engine';

  async enrich(title: string, location: string, description: string): Promise<AIEnrichmentResult> {
    // Simulate slight API network latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    const descLower = description.toLowerCase();
    const titleLower = title.toLowerCase();

    // 1. Skill Extraction & Alias Normalization
    const skills: string[] = [];
    const frontendStack: string[] = [];
    const backendStack: string[] = [];
    const dbStack: string[] = [];
    const cloudStack: string[] = [];
    const devopsStack: string[] = [];
    const aiStack: string[] = [];

    // Keywords mapping
    if (descLower.includes('react') || descLower.includes('next.js') || descLower.includes('nextjs')) {
      skills.push('React');
      frontendStack.push('React');
    }
    if (descLower.includes('next.js') || descLower.includes('nextjs')) {
      skills.push('Next.js');
      frontendStack.push('Next.js');
    }
    if (descLower.includes('js ') || descLower.includes('javascript')) {
      skills.push('JavaScript');
    }
    if (descLower.includes('ts ') || descLower.includes('typescript')) {
      skills.push('TypeScript');
    }
    if (descLower.includes('node') || descLower.includes('express')) {
      skills.push('Node.js');
      backendStack.push('Node.js');
    }
    if (descLower.includes('python')) {
      skills.push('Python');
      backendStack.push('Python');
    }
    if (descLower.includes('postgres') || descLower.includes('postgresql')) {
      skills.push('PostgreSQL');
      dbStack.push('PostgreSQL');
    }
    if (descLower.includes('mongo') || descLower.includes('mongodb')) {
      skills.push('MongoDB');
      dbStack.push('MongoDB');
    }
    if (descLower.includes('aws') || descLower.includes('amazon')) {
      skills.push('AWS');
      cloudStack.push('AWS');
    }
    if (descLower.includes('docker') || descLower.includes('kubernetes')) {
      skills.push('Docker');
      devopsStack.push('Docker');
    }
    if (descLower.includes('ai ') || descLower.includes('machine learning') || descLower.includes('llm') || descLower.includes('gpt')) {
      skills.push('Machine Learning');
      aiStack.push('LLM');
    }

    // Default skills if none match
    if (skills.length === 0) {
      skills.push('Git', 'Data Structures', 'Algorithms');
    }

    // 2. Experience Level Classification
    let exp: 'Intern' | 'Entry Level' | 'Junior' | 'Mid Level' | 'Senior' | 'Lead' | 'Manager' = 'Entry Level';
    if (titleLower.includes('intern') || descLower.includes('internship')) {
      exp = 'Intern';
    } else if (titleLower.includes('senior') || titleLower.includes('sr.')) {
      exp = 'Senior';
    } else if (titleLower.includes('lead') || titleLower.includes('principal')) {
      exp = 'Lead';
    } else if (titleLower.includes('manager') || titleLower.includes('head')) {
      exp = 'Manager';
    } else if (titleLower.includes('junior') || titleLower.includes('jr.')) {
      exp = 'Junior';
    }

    // 3. Employment Type Normalization
    let emp: 'Internship' | 'Full-Time' | 'Part-Time' | 'Contract' | 'Freelance' = 'Full-Time';
    if (titleLower.includes('intern') || descLower.includes('internship') || exp === 'Intern') {
      emp = 'Internship';
    } else if (descLower.includes('part-time') || descLower.includes('part time')) {
      emp = 'Part-Time';
    } else if (descLower.includes('contract') || descLower.includes('consultant')) {
      emp = 'Contract';
    }

    // 4. Remote Type Classification
    let remote: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown' = 'Unknown';
    if (descLower.includes('remote') || location.toLowerCase().includes('remote')) {
      remote = 'Remote';
    } else if (descLower.includes('hybrid') || location.toLowerCase().includes('hybrid')) {
      remote = 'Hybrid';
    } else if (descLower.includes('onsite') || descLower.includes('in-office') || descLower.includes('in office')) {
      remote = 'Onsite';
    }

    // 5. Tags & Classifications
    const tags: string[] = [];
    if (frontendStack.length > 0) tags.push('Frontend');
    if (backendStack.length > 0) tags.push('Backend');
    if (aiStack.length > 0) tags.push('AI');
    if (cloudStack.length > 0 || devopsStack.length > 0) tags.push('Cloud');
    if (tags.length === 0) tags.push('Software Engineering');

    // 6. Salary Normalization Parser
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: string | null = null;
    let salaryPeriod: 'HOURLY' | 'MONTHLY' | 'ANNUAL' | null = null;

    // Standard regex mapping for "$120,000 - $160,000" or similar ranges
    const rangeMatch = description.match(/\$(\d{2,3}),?(\d{3})\s*-\s*\$(\d{2,3}),?(\d{3})/);
    if (rangeMatch) {
      salaryMin = parseInt(rangeMatch[1] + rangeMatch[2], 10);
      salaryMax = parseInt(rangeMatch[3] + rangeMatch[4], 10);
      salaryCurrency = 'USD';
      salaryPeriod = 'ANNUAL';
    } else {
      const hourlyMatch = description.match(/\$(\d{2,3})\s*-\s*\$(\d{2,3})\s*(per hour|hourly|\/h)/i);
      if (hourlyMatch) {
        salaryMin = parseInt(hourlyMatch[1], 10);
        salaryMax = parseInt(hourlyMatch[2], 10);
        salaryCurrency = 'USD';
        salaryPeriod = 'HOURLY';
      }
    }

    return {
      skills,
      techStack: {
        frontend: frontendStack,
        backend: backendStack,
        database: dbStack,
        cloud: cloudStack,
        devops: devopsStack,
        ai: aiStack,
      },
      experienceLevel: exp,
      employmentType: emp,
      remoteType: remote,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      tags,
      qualityScore: 0.95,
      reasoning: 'Extracted using local keyword-rules classification engine fallback.',
      tokensUsed: 0,
      estimatedCost: 0,
    };
  }
}

// 3. Provider Factory Selector
export class AIProviderFactory {
  static getProvider(): AIProvider {
    if (process.env.GEMINI_API_KEY) {
      return new GeminiAIProvider(process.env.GEMINI_API_KEY);
    }
    return new MockAIProvider();
  }
}
