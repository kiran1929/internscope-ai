import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AICareerAnalysisPayload {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suitableRoles: string[];
  careerPaths: Array<{
    title: string;
    steps: string[];
  }>;
  hiringIndustries: string[];
  estimatedReadiness: number;
  
  missingSkills: string[];
  missingTechnologies: string[];
  frequentSkills: string[];
  criticalGaps: string[];
  strengthAreas: string[];
  
  interviewReadinessScore: number;
  technicalReadiness: number;
  customPortfolioScore?: number; // Internal helper
  behavioralReadiness: number;
  portfolioStrength: number;
  projectQuality: number;
  communicationReadiness: number;

  roadmaps: Array<{
    skillName: string;
    steps: Array<{ name: string; details: string }>;
    estimatedHours: number;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    prerequisites: string[];
    expectedImpact: string;
  }>;
}

export interface AICareerServiceResult {
  structuredData: AICareerAnalysisPayload;
  careerScore: number;
  resumeQualityScore: number;
  jobMatchAvg: number;
  skillCoverageScore: number;
  projectQualityScore: number;
  experienceScore: number;
  consistencyScore: number;
  
  provider: string;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
  latencyMs: number;
}

export class AICareerService {
  private static MODEL_NAME = 'gemini-1.5-flash';

  static async analyze(
    resume: {
      id: string;
      qualityScore: number | null;
      structuredData: any;
    },
    matches: Array<{
      overallScore: number;
      skillScore: number;
      techScore: number;
      experienceScore: number;
      missingSkills: string[];
      missingTechnologies: string[];
    }>
  ): Promise<AICareerServiceResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Compute aggregate statistics from matches
    const totalMatchesCount = matches.length;
    const jobMatchAvg = totalMatchesCount > 0 
      ? Math.round(matches.reduce((acc, m) => acc + m.overallScore, 0) / totalMatchesCount)
      : 70; // baseline default

    const skillScoreAvg = totalMatchesCount > 0
      ? Math.round(matches.reduce((acc, m) => acc + m.skillScore, 0) / totalMatchesCount)
      : 65;

    const techScoreAvg = totalMatchesCount > 0
      ? Math.round(matches.reduce((acc, m) => acc + m.techScore, 0) / totalMatchesCount)
      : 60;

    const experienceScoreAvg = totalMatchesCount > 0
      ? Math.round(matches.reduce((acc, m) => acc + m.experienceScore, 0) / totalMatchesCount)
      : 75;

    // Gather frequency count of missing skills/technologies
    const missingSkillsMap: Record<string, number> = {};
    const missingTechMap: Record<string, number> = {};
    
    matches.forEach(m => {
      m.missingSkills.forEach(s => { missingSkillsMap[s] = (missingSkillsMap[s] || 0) + 1; });
      m.missingTechnologies.forEach(t => { missingTechMap[t] = (missingTechMap[t] || 0) + 1; });
    });

    const summarizedMissingSkills = Object.entries(missingSkillsMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 8);

    const summarizedMissingTechs = Object.entries(missingTechMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 8);

    const matchesSummary = {
      avgMatchScore: jobMatchAvg,
      avgSkillScore: skillScoreAvg,
      avgTechScore: techScoreAvg,
      avgExperienceScore: experienceScoreAvg,
      topMissingSkills: summarizedMissingSkills,
      topMissingTechs: summarizedMissingTechs,
    };

    let structuredData: AICareerAnalysisPayload;
    let provider = 'Mock-Local';
    let model = 'rules-engine';
    let tokensUsed = 0;
    let estimatedCost = 0.0;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: this.MODEL_NAME });

        const prompt = this.getPrompt(resume.structuredData, matchesSummary);
        const response = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.response.text();
        if (!text) throw new Error('Empty payload returned from Gemini');

        structuredData = JSON.parse(text);
        provider = 'Gemini';
        model = this.MODEL_NAME;

        const promptTokens = response.response.usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = response.response.usageMetadata?.candidatesTokenCount || 0;
        tokensUsed = promptTokens + candidatesTokens;
        estimatedCost = (promptTokens * 0.000000075) + (candidatesTokens * 0.0000003);
      } catch (error) {
        console.error('Gemini career analysis execution failed, falling back to local mocks:', error);
        structuredData = this.getMockAnalysis(resume.structuredData, matchesSummary);
      }
    } else {
      structuredData = this.getMockAnalysis(resume.structuredData, matchesSummary);
    }

    // Mathematical Careers Score formulation (0-100)
    const resumeQualityScore = resume.qualityScore || 75;
    const skillCoverageScore = skillScoreAvg;
    const projectQualityScore = structuredData.projectQuality || 70;
    const experienceScore = experienceScoreAvg;
    
    // Consistency Score: estimated based on summary size & education matching completeness
    const profileData = resume.structuredData;
    let consistencyScore = 80;
    if (!profileData.summary) consistencyScore -= 15;
    if (!profileData.links || profileData.links.length === 0) consistencyScore -= 10;
    if (profileData.education?.length > 1) consistencyScore += 10;
    consistencyScore = Math.max(Math.min(consistencyScore, 100), 40);

    const careerScore = Math.round(
      (resumeQualityScore * 0.20) +
      (jobMatchAvg * 0.20) +
      (skillCoverageScore * 0.20) +
      (projectQualityScore * 0.15) +
      (experienceScore * 0.15) +
      (consistencyScore * 0.10)
    );

    const latencyMs = Date.now() - startTime;

    return {
      structuredData: this.sanitizePayload(structuredData),
      careerScore,
      resumeQualityScore,
      jobMatchAvg,
      skillCoverageScore,
      projectQualityScore,
      experienceScore,
      consistencyScore,
      provider,
      model,
      tokensUsed,
      estimatedCost: Math.round(estimatedCost * 100000) / 100000,
      latencyMs,
    };
  }

  private static sanitizePayload(payload: any): AICareerAnalysisPayload {
    return {
      summary: payload.summary || 'Summary not parsed.',
      strengths: Array.isArray(payload.strengths) ? payload.strengths.map(String) : [],
      weaknesses: Array.isArray(payload.weaknesses) ? payload.weaknesses.map(String) : [],
      suitableRoles: Array.isArray(payload.suitableRoles) ? payload.suitableRoles.map(String) : [],
      careerPaths: Array.isArray(payload.careerPaths) ? payload.careerPaths.map((p: any) => ({
        title: p.title || 'Career Path option',
        steps: Array.isArray(p.steps) ? p.steps.map(String) : [],
      })) : [],
      hiringIndustries: Array.isArray(payload.hiringIndustries) ? payload.hiringIndustries.map(String) : [],
      estimatedReadiness: typeof payload.estimatedReadiness === 'number' ? payload.estimatedReadiness : 0.7,
      missingSkills: Array.isArray(payload.missingSkills) ? payload.missingSkills.map(String) : [],
      missingTechnologies: Array.isArray(payload.missingTechnologies) ? payload.missingTechnologies.map(String) : [],
      frequentSkills: Array.isArray(payload.frequentSkills) ? payload.frequentSkills.map(String) : [],
      criticalGaps: Array.isArray(payload.criticalGaps) ? payload.criticalGaps.map(String) : [],
      strengthAreas: Array.isArray(payload.strengthAreas) ? payload.strengthAreas.map(String) : [],
      interviewReadinessScore: typeof payload.interviewReadinessScore === 'number' ? payload.interviewReadinessScore : 70,
      technicalReadiness: typeof payload.technicalReadiness === 'number' ? payload.technicalReadiness : 70,
      behavioralReadiness: typeof payload.behavioralReadiness === 'number' ? payload.behavioralReadiness : 70,
      portfolioStrength: typeof payload.portfolioStrength === 'number' ? payload.portfolioStrength : 70,
      projectQuality: typeof payload.projectQuality === 'number' ? payload.projectQuality : 70,
      communicationReadiness: typeof payload.communicationReadiness === 'number' ? payload.communicationReadiness : 70,
      roadmaps: Array.isArray(payload.roadmaps) ? payload.roadmaps.map((r: any) => ({
        skillName: r.skillName || 'Skill',
        steps: Array.isArray(r.steps) ? r.steps.map((st: any) => ({
          name: st.name || 'Step name',
          details: st.details || 'Step details description',
        })) : [],
        estimatedHours: typeof r.estimatedHours === 'number' ? r.estimatedHours : 10,
        difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(r.difficulty) ? r.difficulty : 'Intermediate',
        prerequisites: Array.isArray(r.prerequisites) ? r.prerequisites.map(String) : [],
        expectedImpact: r.expectedImpact || 'Improves career options.',
      })) : [],
    };
  }

  private static getMockAnalysis(resume: any, matchesSummary: any): AICareerAnalysisPayload {
    const defaultSkills = matchesSummary.topMissingSkills.length > 0 ? matchesSummary.topMissingSkills : ['Docker', 'AWS'];
    const defaultTechs = matchesSummary.topMissingTechs.length > 0 ? matchesSummary.topMissingTechs : ['TypeScript', 'GraphQL'];

    return {
      summary: `Based on your resume as ${resume.fullName || 'a Software professional'}, you have built solid foundations in technical topics. Your average job match score across target internships stands at ${matchesSummary.avgMatchScore}%. Adding containerization skills and database scaling tools will significantly broaden your application success.`,
      strengths: ['Solid foundation in core coding tools.', 'Strong project examples with outcome metrics.'],
      weaknesses: ['Lacks familiarity with modern cloud DevOps tooling.', 'Needs more system architecture experience.'],
      suitableRoles: ['Junior Full-Stack Engineer', 'Software Engineering Intern', 'Web Developer'],
      careerPaths: [
        {
          title: 'DevOps & Backend Engineer',
          steps: ['Master Docker containers local setups', 'Deploy application backend services to AWS EC2', 'Build automated CI/CD pipelines using GitHub Actions']
        },
        {
          title: 'Senior Frontend Architect',
          steps: ['Build production Next.js apps with TypeScript', 'Implement tailwind layouts and web audits', 'Optimize LCP & INP metrics for client bundles']
        }
      ],
      hiringIndustries: ['Software-as-a-Service (SaaS)', 'Cloud Computing Infrastructure', 'E-Commerce Platforms'],
      estimatedReadiness: 0.72,
      missingSkills: defaultSkills,
      missingTechnologies: defaultTechs,
      frequentSkills: ['React', 'Node.js', 'Git', 'REST APIs'],
      criticalGaps: ['Docker / Containers setup', 'Cloud Deployment configuration'],
      strengthAreas: ['UI development speed', 'Relational database schema modeling'],
      interviewReadinessScore: 72,
      technicalReadiness: 75,
      behavioralReadiness: 70,
      portfolioStrength: 78,
      projectQuality: 72,
      communicationReadiness: 70,
      roadmaps: defaultSkills.slice(0, 2).map((sName: string) => ({
        skillName: sName,
        steps: [
          { name: `Understanding ${sName} principles`, details: `Learn fundamental structures, components, and vocabulary of ${sName}.` },
          { name: `Basic CLI operations`, details: `Run local scripts and configure parameters inside your terminal.` },
          { name: `Integrating in project pipelines`, details: `Incorporate ${sName} into a Next.js or Node workspace build process.` }
        ],
        estimatedHours: 15,
        difficulty: 'Intermediate',
        prerequisites: ['Terminal console familiarity', 'Basic Javascript/Python programming'],
        expectedImpact: `Enables professional deployments and closes matching requirements for ${matchesSummary.avgMatchScore}% of roles.`
      }))
    };
  }

  private static getPrompt(resume: any, matchesSummary: any): string {
    return `
You are an expert career advisor and technical talent strategist. Analyze the candidate's resume and their matching job metrics to perform a deep career intelligence analysis.

Candidate Resume Profile:
- Name: ${resume.fullName}
- Summary: ${resume.summary}
- Skills: ${JSON.stringify(resume.skills)}
- Technologies: ${JSON.stringify(resume.technologies)}
- Experience: ${JSON.stringify(resume.experience?.map((e: any) => ({ title: e.title, company: e.company })))}
- Education: ${JSON.stringify(resume.education?.map((e: any) => ({ degree: e.degree, major: e.major, school: e.school })))}

Matched Job Gaps & Gaps Summary:
${JSON.stringify(matchesSummary)}

Perform the analysis and return exactly a JSON object matching this schema:
{
  "summary": "A comprehensive 2-3 paragraph career analysis summarizing where the candidate stands, their strengths, and immediate growth areas.",
  "strengths": ["Key professional or technical strength 1", "Strength 2"],
  "weaknesses": ["Areas of development or skill gap 1", "Weakness 2"],
  "suitableRoles": ["Software Engineer Intern", "Frontend Engineer", "Full Stack Developer"],
  "careerPaths": [
    {
      "title": "Full-Stack Engineer Path",
      "steps": ["Frontend basics with React", "Node.js / Database integration", "AWS Cloud / DevOps deployments"]
    }
  ],
  "hiringIndustries": ["Fintech", "Developer Tools", "AI / Machine Learning"],
  "estimatedReadiness": 0.85,
  
  "missingSkills": ["Docker", "Kubernetes"],
  "missingTechnologies": ["TypeScript", "GraphQL"],
  "frequentSkills": ["React", "PostgreSQL"],
  "criticalGaps": ["Containerization", "Strong typing in production environments"],
  "strengthAreas": ["Client-side layout systems", "SQL schema design"],
  
  "interviewReadinessScore": 75,
  "technicalReadiness": 80,
  "behavioralReadiness": 70,
  "portfolioStrength": 85,
  "projectQuality": 78,
  "communicationReadiness": 75,
  
  "roadmaps": [
    {
      "skillName": "Docker",
      "steps": [
        { "name": "Containers basics", "details": "Understand image isolation vs virtual machines." },
        { "name": "Docker CLI", "details": "Learn build, run, exec, and ps commands." },
        { "name": "Dockerfiles", "details": "Write optimized multi-stage build files." },
        { "name": "Docker Compose", "details": "Coordinate multi-container local stack services." }
      ],
      "estimatedHours": 12,
      "difficulty": "Intermediate",
      "prerequisites": ["Basic Linux terminal CLI familiarity"],
      "expectedImpact": "Enables local environment reproducibility and standardized container deployments in CI/CD pipeline."
    }
  ]
}
`;
  }
}
