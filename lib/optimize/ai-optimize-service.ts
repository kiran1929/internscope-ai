import { GoogleGenerativeAI } from '@google/generative-ai';

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
    resumeStructuredData: any;
    job?: any;
  }): Promise<ATSAnalysisResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    let structuredData: ATSAnalysisPayload;
    let provider = 'Mock-Local';
    let model = 'rules-engine';
    let tokensUsed = 0;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getPrompt(params.resumeStructuredData, params.job);
        
        const response = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.response.text();
        if (!text) throw new Error('Empty payload returned from Gemini optimizer');

        structuredData = JSON.parse(text);
        provider = 'Gemini';
        model = this.MODEL_NAME;

        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
      } catch (error) {
        console.error('Gemini ATS optimization failed, falling back to mock optimization:', error);
        structuredData = this.getMockOptimization(params.resumeStructuredData, params.job);
      }
    } else {
      structuredData = this.getMockOptimization(params.resumeStructuredData, params.job);
    }

    return {
      structuredData: this.sanitizeOptimization(structuredData, params.resumeStructuredData),
      provider,
      model,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  private static sanitizeOptimization(data: any, originalResume: any): ATSAnalysisPayload {
    return {
      atsScore: typeof data.atsScore === 'number' ? data.atsScore : 70,
      keywordMatchScore: typeof data.keywordMatchScore === 'number' ? data.keywordMatchScore : 65,
      missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.map(String) : [],
      weakBullets: Array.isArray(data.weakBullets) ? data.weakBullets.map(String) : [],
      strongBullets: Array.isArray(data.strongBullets) ? data.strongBullets.map(String) : [],
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills.map(String) : [],
      suggestedProjects: Array.isArray(data.suggestedProjects) ? data.suggestedProjects.map(String) : [],
      suggestedCertifications: Array.isArray(data.suggestedCertifications) ? data.suggestedCertifications.map(String) : [],
      formattingIssues: Array.isArray(data.formattingIssues) ? data.formattingIssues.map(String) : [],
      improvementChecklist: Array.isArray(data.improvementChecklist) ? data.improvementChecklist.map(String) : ['Rewrite experience with action verbs'],
      sections: Array.isArray(data.sections) ? data.sections.map((s: any) => ({
        sectionType: s.sectionType || 'Experience',
        originalContent: s.originalContent || '',
        optimizedContent: s.optimizedContent || '',
        bulletRewrites: Array.isArray(s.bulletRewrites) ? s.bulletRewrites.map((br: any) => ({
          original: br.original || '',
          suggested: br.suggested || '',
          explanation: br.explanation || '',
        })) : [],
      })) : [],
    };
  }

  private static getMockOptimization(resume: any, job: any): ATSAnalysisPayload {
    // Generate mock details based on resume and target job
    const jobTitle = job?.title || 'Software Engineer';
    const originalSummary = resume?.summary || 'Experienced developer specializing in frontend and backend systems.';
    const originalSkills = Array.isArray(resume?.skills) ? resume.skills.join(', ') : 'JavaScript, React, Node.js';

    return {
      atsScore: 72,
      keywordMatchScore: 68,
      missingKeywords: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'AWS Deployment', 'GraphQL'],
      weakBullets: [
        'Built dashboard using React.',
        'Worked on databases.',
        'Helped teammates fix bugs.'
      ],
      strongBullets: [
        'Integrated multi-source ingestion parsers that synchronized Neon PostgreSQL records.'
      ],
      missingSkills: ['Cloud architecture', 'Automated testing', 'Continuous Integration'],
      suggestedProjects: [
        'Construct a CI/CD automation workflow deploying simple servers with AWS ECS and Docker.'
      ],
      suggestedCertifications: ['AWS Certified Developer - Associate', 'Certified Kubernetes Administrator (CKA)'],
      formattingIssues: [
        'Mixed font spacing in work experience detail blocks.',
        'Missing quantified results percentages in 60% of bullet points.'
      ],
      improvementChecklist: [
        'Insert missing Docker & Kubernetes tags into your skills summary list.',
        'Rewrite weak React dashboards bullets with action verbs and metrics.',
        'Integrate a dedicated projects listing section to showcase systems integration skills.'
      ],
      sections: [
        {
          sectionType: 'Summary',
          originalContent: originalSummary,
          optimizedContent: `Highly capable Software Engineer specializing in scalable full-stack development, distributed processing systems, and API design. Expert in JavaScript, React, and Node.js. Passionate about deploying containerized cloud workflows (Docker, Kubernetes) and optimizing latency performance.`,
          bulletRewrites: []
        },
        {
          sectionType: 'Skills',
          originalContent: originalSkills,
          optimizedContent: `${originalSkills}, Docker, Kubernetes, CI/CD, AWS, GraphQL`,
          bulletRewrites: []
        },
        {
          sectionType: 'Experience',
          originalContent: `Worked as developer building React dashboard pages. Fixed bugs and collaborated.`,
          optimizedContent: `Engineered responsive analytical dashboard interfaces using React and Next.js, resulting in a 35% performance improvement in rendering times. Orchestrated distributed bug resolution campaigns that reduced backlog overhead by 20%.`,
          bulletRewrites: [
            {
              original: 'Worked as developer building React dashboard pages',
              suggested: 'Engineered responsive analytical dashboard interfaces using React and Next.js, reducing rendering times by 35%',
              explanation: 'Uses technical keywords (Next.js), action verbs (Engineered), and quantified results (reducing render time by 35%).'
            },
            {
              original: 'Fixed bugs and collaborated',
              suggested: 'Orchestrated distributed bug resolution campaigns that reduced backlog overhead by 20%',
              explanation: 'Emphasizes leadership qualities (Orchestrated) and quantifies team output impact (reducing backlog by 20%).'
            }
          ]
        }
      ]
    };
  }

  private static getPrompt(resume: any, job: any): string {
    return `
You are an expert technical recruiter and ATS software architect. Analyze the candidate's resume against this target job description and compile an ATS optimization analysis.

Target Job:
- Title: ${job?.title || 'General Software Engineer'}
- Description: ${job?.description || 'N/A'}
- Requirements: ${job?.requirements || 'N/A'}

Candidate Resume structured sections:
${JSON.stringify(resume)}

Analyze:
1. ATS Score (0-100)
2. Keyword density and Keyword match score (0-100)
3. Missing Keywords
4. Weak bullet points vs strong bullet points
5. Formatting issues and readability
6. Specific section-by-section optimization suggestions (Summary, Experience, Projects, Skills, Education, Certifications, Achievements)
7. Bullet points rewrites containing Action Verbs, Quantified Results, Technical Keywords, and Impact Statements.

Return exactly a JSON object matching this schema:
{
  "atsScore": 75,
  "keywordMatchScore": 70,
  "missingKeywords": ["Docker", "TypeScript", "CI/CD"],
  "weakBullets": ["Worked on a dashboard using React"],
  "strongBullets": ["Led development of microservices increasing throughput by 25%"],
  "missingSkills": ["CI/CD pipelines"],
  "suggestedProjects": ["Build a full-stack Next.js pipeline integrating unit tests"],
  "suggestedCertifications": ["AWS Cloud Practitioner"],
  "formattingIssues": ["Mixed font sizes in experience section"],
  "improvementChecklist": ["Refactor experience bullet points with quantitative results"],
  "sections": [
    {
      "sectionType": "Summary",
      "originalContent": "Full stack developer with experience in React and Node.",
      "optimizedContent": "Result-oriented Full Stack Software Engineer with 2+ years of experience specializing in React, Node.js, and TypeScript.",
      "bulletRewrites": []
    },
    {
      "sectionType": "Experience",
      "originalContent": "- Built dashboard using React.",
      "optimizedContent": "- Engineered responsive analytics dashboard using React and Tailwind CSS, reducing client render times by 30%.",
      "bulletRewrites": [
        {
          "original": "Built dashboard using React",
          "suggested": "Engineered responsive analytics dashboard using React and Tailwind CSS, reducing client render times by 30%",
          "explanation": "Added action verbs, technical context, and quantified impact."
        }
      ]
    }
  ]
}
`;
  }
}
