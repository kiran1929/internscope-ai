import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedQuestionPayload {
  category: 'Technical' | 'Behavioral' | 'Resume-based' | 'Project-based' | 'Problem Solving' | 'Company Research' | 'Role-specific';
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sampleAnswer: string;
}

export class AIQuestionService {
  private static MODEL_NAME = 'gemini-1.5-flash';

  static async generate(params: {
    resume: any;
    job?: any;
    difficulty: string;
    categories: string[];
    count: number;
  }): Promise<GeneratedQuestionPayload[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getPrompt(params.resume, params.job, params.difficulty, params.categories, params.count);
        
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.response.text();
        if (!text) throw new Error('Empty payload returned from Gemini');

        const array: GeneratedQuestionPayload[] = JSON.parse(text);
        if (!Array.isArray(array)) throw new Error('Result is not a JSON array');

        return array.map(this.sanitizeQuestion);
      } catch (error) {
        console.error('Gemini question generation failed, using mock questions:', error);
        return this.getMockQuestions(params.categories, params.difficulty, params.count);
      }
    } else {
      return this.getMockQuestions(params.categories, params.difficulty, params.count);
    }
  }

  private static sanitizeQuestion(q: any): GeneratedQuestionPayload {
    const validCategories = [
      'Technical', 'Behavioral', 'Resume-based', 'Project-based', 
      'Problem Solving', 'Company Research', 'Role-specific'
    ];
    
    return {
      category: validCategories.includes(q.category) ? q.category : 'Technical',
      text: q.text || 'Describe a difficult technical problem you solved.',
      difficulty: q.difficulty || 'Medium',
      sampleAnswer: q.sampleAnswer || 'A structured answer detailing situations, actions taken, and final outcomes.',
    };
  }

  private static getMockQuestions(categories: string[], difficulty: string, count: number): GeneratedQuestionPayload[] {
    const mocks: GeneratedQuestionPayload[] = [
      {
        category: 'Technical',
        text: 'Explain the difference between SQL and NoSQL databases, and when you would select one over the other.',
        difficulty: 'Medium',
        sampleAnswer: 'SQL is relational, structured, uses schemas. NoSQL is non-relational, document/key-value oriented, schema-less. Use SQL for transactions, NoSQL for scale/flexibility.',
      },
      {
        category: 'Behavioral',
        text: 'Tell me about a time you had a conflict with a team member during a project. How did you resolve it?',
        difficulty: 'Medium',
        sampleAnswer: 'Provide a structured behavioral scenario: situation, task, resolution steps, and outcome lessons.',
      },
      {
        category: 'Resume-based',
        text: 'Your profile highlights React and Node.js. Walk me through a challenging feature you built with this stack.',
        difficulty: 'Medium',
        sampleAnswer: 'Describe project requirements, custom endpoints, state management, and outcome metrics.',
      },
      {
        category: 'Problem Solving',
        text: 'How would you approach debugging a memory leak in a Next.js production server app?',
        difficulty: 'Hard',
        sampleAnswer: 'Take heap snapshots, inspect memory timelines, review open listeners, and trace package dependencies.',
      },
      {
        category: 'Project-based',
        text: 'Describe the architecture of the most complex project listed in your resume.',
        difficulty: 'Medium',
        sampleAnswer: 'Detail the server architecture, databases, schemas, API frameworks, and hosting platforms.',
      }
    ];

    const result: GeneratedQuestionPayload[] = [];
    for (let i = 0; i < count; i++) {
      const base = mocks[i % mocks.length];
      result.push({
        ...base,
        category: (categories.includes(base.category) ? base.category : (categories[0] || 'Technical')) as any,
        difficulty: difficulty as any,
      });
    }
    return result;
  }

  private static getPrompt(resume: any, job: any, difficulty: string, categories: string[], count: number): string {
    return `
You are an elite technical interviewer and behavioral specialist. Generate a list of ${count} interview questions tailored for this candidate and their target role.

Target Job Information:
- Title: ${job?.title || 'General Software Engineering'}
- Description: ${job?.description || 'N/A'}
- Requirements: ${job?.requirements || 'N/A'}

Candidate Profile:
- Skills: ${JSON.stringify(resume?.skills || [])}
- Technologies: ${JSON.stringify(resume?.technologies || [])}
- Summary: ${resume?.summary || 'N/A'}

Parameters:
- Difficulty Level: ${difficulty}
- Target Categories: ${categories.join(', ')}

Return exactly a JSON array containing ${count} objects matching this schema:
[
  {
    "category": "One of: Technical, Behavioral, Resume-based, Project-based, Problem Solving, Company Research, Role-specific",
    "text": "The exact question content. Be specific, realistic, and tailored to the candidate's level.",
    "difficulty": "${difficulty}",
    "sampleAnswer": "Key bullet points, expectations, or sample ideal answer guidelines for this question."
  }
]
`;
  }
}
