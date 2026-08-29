import { prisma } from '../db';

export class ContextBuilder {
  static async buildContext(userId: string): Promise<{
    contextString: string;
    contextSize: number;
    careerScore: number;
    skillsProgress: { name: string; count: number }[];
    matchingJobs: { title: string; companyName: string; score: number }[];
  }> {
    // 1. Fetch user profile, resume, matches, goals, and career analyses in parallel
    const [
      user,
      latestResume,
      careerAnalysis,
      activeGoals,
      pastSessions,
      latestOptimizations,
      savedOpportunities,
      applications,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.resume.findFirst({
        where: { userId, isParsed: true },
        orderBy: { version: 'desc' },
      }),
      prisma.careerAnalysis.findUnique({
        where: { userId },
        include: { roadmaps: true },
      }),
      prisma.careerGoal.findMany({
        where: { userId, status: 'IN_PROGRESS' },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.interviewSession.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          questions: {
            where: { category: { equals: 'Behavioral', mode: 'insensitive' } },
            include: { evaluation: true },
            take: 2,
          },
          summary: true,
        },
      }),
      prisma.resumeOptimization.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { atsAnalysis: true },
        take: 2,
      }),
      prisma.savedOpportunity.findMany({
        where: { userId },
        include: { opportunity: { include: { company: true } } },
        take: 5,
      }),
      prisma.application.findMany({
        where: { userId },
        include: { opportunity: { include: { company: true } } },
        take: 5,
      }),
    ]);

    // 2. Assemble context blocks
    const contextBlocks: string[] = [];

    // Profile Context
    contextBlocks.push(`Candidate Name: ${user?.clerkId || 'Candidate'}`);
    
    // Career Analysis Context
    const careerScore = careerAnalysis?.careerScore || 70;
    contextBlocks.push(`Overall Career Score: ${careerScore}`);
    if (careerAnalysis) {
      contextBlocks.push(`Strongest Areas: ${JSON.stringify(careerAnalysis.strengthAreas)}`);
      contextBlocks.push(`Missing Skills Gaps: ${JSON.stringify(careerAnalysis.missingSkills)}`);
      
      const roadmapsSummary = careerAnalysis.roadmaps.map(r => `${r.skillName} (${r.difficulty}, ${r.estimatedHours}h)`).join(', ');
      contextBlocks.push(`Active Roadmaps: ${roadmapsSummary}`);
    }

    // Resume Context
    if (latestResume) {
      const data = latestResume.structuredData as any;
      contextBlocks.push(`Extracted Skills: ${JSON.stringify(data?.skills || [])}`);
      contextBlocks.push(`Extracted Technologies: ${JSON.stringify(data?.technologies || [])}`);
      if (Array.isArray(data?.projects)) {
        const projSummary = data.projects
          .map((p: any) => {
            const name = p.name || p.title || 'Project';
            const desc = p.description ? `: ${String(p.description).slice(0, 120)}` : '';
            return `${name}${desc}`;
          })
          .join('; ');
        contextBlocks.push(`Resume Projects: ${projSummary}`);
      }
      if (Array.isArray(data?.experience)) {
        const expSummary = data.experience
          .map((e: any) => {
            const role = e.role || e.title || 'Role';
            const company = e.company || 'Company';
            return `${role} at ${company}`;
          })
          .join('; ');
        contextBlocks.push(`Work Experience: ${expSummary}`);
      }
    }

    // Active Goals Context
    if (activeGoals.length > 0) {
      const goalsSummary = activeGoals.map(g => `${g.title} (${Math.round(g.progress)}% progress, missing: ${g.missingSkills.join(', ')})`).join('; ');
      contextBlocks.push(`Active Goals: ${goalsSummary}`);
    }

    // Mock Interviews Context
    if (pastSessions.length > 0) {
      const sessionsSummary = pastSessions
        .map((s) => {
          const parts = [`"${s.title}" (Overall: ${s.overallScore ?? 'N/A'}%`];
          if (s.behavioralScore != null) parts.push(`Behavioral: ${s.behavioralScore}%`);
          parts.push(')');
          return parts.join(', ');
        })
        .join('; ');
      contextBlocks.push(`Recent Interview Sessions: ${sessionsSummary}`);

      const behavioralNotes: string[] = [];
      pastSessions.forEach((session) => {
        session.questions.forEach((q) => {
          if (!q.evaluation) return;
          const evalParts = [`Q: "${q.text.slice(0, 80)}..."`];
          if (q.evaluation.starCoachingFeedback) {
            evalParts.push(`STAR feedback: ${q.evaluation.starCoachingFeedback}`);
          }
          if (q.evaluation.weaknesses.length > 0) {
            evalParts.push(`Weaknesses: ${q.evaluation.weaknesses.join(', ')}`);
          }
          behavioralNotes.push(evalParts.join(' | '));
        });
        if (session.summary?.recommendedPractice?.length) {
          behavioralNotes.push(
            `Recommended practice from "${session.title}": ${session.summary.recommendedPractice.join(', ')}`
          );
        }
      });
      if (behavioralNotes.length > 0) {
        contextBlocks.push(`Behavioral Interview Coaching History:\n${behavioralNotes.join('\n')}`);
      }
    }

    // Resume Optimization / ATS Context
    if (latestOptimizations.length > 0) {
      const optSummary = latestOptimizations.map(o => `"${o.title}" (ATS Score: ${o.atsScore}%)`).join(', ');
      contextBlocks.push(`ATS Optimizations Log: ${optSummary}`);
    }

    // Applications & Saved Context
    if (applications.length > 0) {
      const appSummary = applications.map(a => `${a.opportunity.title} at ${a.opportunity.company.name} (Status: ${a.status})`).join(', ');
      contextBlocks.push(`Active Job Applications: ${appSummary}`);
    }
    if (savedOpportunities.length > 0) {
      const savedSummary = savedOpportunities.map(s => `${s.opportunity.title} at ${s.opportunity.company.name}`).join(', ');
      contextBlocks.push(`Saved Job Opportunities: ${savedSummary}`);
    }

    // 3. Compile Skills Progress details for the Copilot Dashboard charts
    const skillsProgress: { name: string; count: number }[] = [];
    if (careerAnalysis) {
      // Mock progress values: skills they already have count high, missing ones count low
      const data = latestResume?.structuredData as any;
      const parsedSkills = Array.isArray(data?.skills) ? data.skills : [];
      
      parsedSkills.slice(0, 4).forEach((s: string) => {
        skillsProgress.push({ name: s, count: 90 });
      });
      careerAnalysis.missingSkills.slice(0, 3).forEach((s: string) => {
        skillsProgress.push({ name: s, count: 25 });
      });
    } else {
      skillsProgress.push(
        { name: 'TypeScript', count: 80 },
        { name: 'React', count: 90 },
        { name: 'Node.js', count: 75 },
        { name: 'Docker', count: 30 }
      );
    }

    // 4. Retrieve matching jobs list
    const matchingJobs: { title: string; companyName: string; score: number }[] = [];
    if (latestResume) {
      const dbMatches = await prisma.jobMatch.findMany({
        where: { resumeId: latestResume.id },
        include: { opportunity: { include: { company: true } } },
        orderBy: { overallScore: 'desc' },
        take: 3,
      });

      dbMatches.forEach(m => {
        matchingJobs.push({
          title: m.opportunity.title,
          companyName: m.opportunity.company.name,
          score: Math.round(m.overallScore),
        });
      });
    }

    const contextString = contextBlocks.join('\n\n');

    return {
      contextString,
      contextSize: contextString.length,
      careerScore,
      skillsProgress,
      matchingJobs,
    };
  }
}
