import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AICoverLetterResult {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export class AICoverLetterService {
  private static MODEL_NAME = 'gemini-1.5-flash';

  static async generate(params: {
    resume: any;
    job: any;
    style: 'Professional' | 'Concise' | 'Enthusiastic' | 'Startup' | 'Corporate';
  }): Promise<AICoverLetterResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    let content = '';
    let provider = 'Mock-Local';
    let model = 'rules-engine';
    let tokensUsed = 0;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getPrompt(params.resume, params.job, params.style);
        
        const response = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        content = response.response.text();
        if (!content) throw new Error('Empty payload returned from Gemini cover letter service');

        provider = 'Gemini';
        model = this.MODEL_NAME;

        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
      } catch (error) {
        console.error('Gemini cover letter generation failed, using mock letter:', error);
        content = this.getMockCoverLetter(params.resume, params.job, params.style);
      }
    } else {
      content = this.getMockCoverLetter(params.resume, params.job, params.style);
    }

    return {
      content: content.trim(),
      provider,
      model,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  private static getMockCoverLetter(resume: any, job: any, style: string): string {
    const company = job?.company?.name || 'Target Company';
    const title = job?.title || 'Software Engineer';
    const name = resume?.fullName || 'Candidate';
    const email = resume?.email || 'candidate@example.com';
    const skillsList = Array.isArray(resume?.skills) ? resume.skills.slice(0, 3).join(', ') : 'React, Node.js';

    if (style === 'Concise') {
      return `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${title} position. With a background in Full Stack Engineering and expertise in ${skillsList}, I am confident in my ability to contribute to your engineering goals immediately.

During my previous projects, I specialized in optimizing database latency and building responsive user interfaces. I look forward to discussing how my skills align with the requirements at ${company}.

Sincerely,
${name}
${email}`;
    }

    if (style === 'Enthusiastic') {
      return `Dear Hiring Manager,

I was absolutely thrilled to see the opening for the ${title} role at ${company}! I have been following your growth and am extremely inspired by your product innovation.

As a developer who lives and breathes engineering efficiency, I love working with ${skillsList}. I am eager to bring my creative problem-solving and full-stack capabilities to your high-performance team. Thank you for your time and consideration!

Best regards,
${name}
${email}`;
    }

    if (style === 'Startup') {
      return `Hey ${company} Team,

I'm applying for the ${title} position. I thrive in fast-paced environments where I can wear multiple hats, build features rapidly, and take ownership of code.

Having built projects using ${skillsList}, I enjoy solving complex architecture problems and optimizing user experiences. I'd love to help ${company} build the next generation of your platform.

Cheers,
${name}
${email}`;
    }

    // Default Professional / Corporate
    return `Dear Hiring Committee,

Please accept this letter as expression of my interest in the ${title} opportunity at ${company}. As a Software Engineer possessing hands-on experience in full-stack architectures and ${skillsList}, I am well-positioned to add value to your development cycles.

In my recent projects, I have implemented scalable backend API routes and engineered high-performance interfaces. My focus remains on delivering structured, maintainable codebases that support strategic product expansions. 

Thank you for considering my application. I look forward to the opportunity to discuss my qualifications further.

Sincerely,
${name}
${email}`;
  }

  private static getPrompt(resume: any, job: any, style: string): string {
    const company = job?.company?.name || 'Target Company';
    const title = job?.title || 'Software Engineer';
    const details = job?.description || 'N/A';

    return `
You are an expert executive resume consultant and executive copywriter. Write a highly tailored cover letter for this candidate applying to this specific job.

Target Job details:
- Title: ${title}
- Company: ${company}
- Job Description: ${details}

Candidate Profile:
- Name: ${resume?.fullName || 'Candidate'}
- Contact: ${resume?.email || ''}
- Skills: ${JSON.stringify(resume?.skills || [])}
- Technologies: ${JSON.stringify(resume?.technologies || [])}
- Career Summary: ${resume?.summary || ''}

Style Parameter:
- Tone Style: ${style} (Write in a style matching: Professional, Concise, Enthusiastic, Startup, Corporate)

Important instructions:
- Ensure the letter is clean, well-spaced, and directly addresses the company's requirements.
- Highlight candidate strengths that intersect with job responsibilities.
- Do not use placeholders like "[Insert Date]" or "[Insert Address]". Provide a clean letter template content.
`;
  }
}
