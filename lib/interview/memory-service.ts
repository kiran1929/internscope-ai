import { prisma } from '@/lib/db';
import {
  CandidateResumeProfile,
  JobInterviewProfile,
  CandidateInterviewMemory,
  CompactAnswerSummary,
  LongitudinalSkillRecord,
  AnswerEvaluationPayload,
} from './llm/types';
import { INTERVIEW_LIMITS } from './constants';

export class InterviewMemoryService {
  /**
   * Builds a compact candidate profile from parsed resume structured data.
   */
  static buildCompactResumeProfile(resumeStructuredData: unknown): CandidateResumeProfile {
    if (!resumeStructuredData || typeof resumeStructuredData !== 'object') {
      return {
        summary: 'Software Engineering Candidate',
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Design'],
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        projects: [],
        experience: [],
      };
    }

    const data = resumeStructuredData as Record<string, unknown>;

    const skills: string[] = Array.isArray(data.skills)
      ? (data.skills as string[]).slice(0, INTERVIEW_LIMITS.maxResumeSkills)
      : [];

    const technologies: string[] = Array.isArray(data.technologies)
      ? (data.technologies as string[]).slice(0, INTERVIEW_LIMITS.maxResumeSkills)
      : [];

    const rawProjects = Array.isArray(data.projects) ? (data.projects as Record<string, unknown>[]) : [];
    const projects = rawProjects.slice(0, INTERVIEW_LIMITS.maxResumeProjects).map((p) => ({
      name: String(p.title || p.name || 'Project'),
      description: String(p.description || '').slice(0, 150),
      technologies: Array.isArray(p.technologies) ? (p.technologies as string[]).slice(0, 4) : [],
      candidateContribution: Array.isArray(p.bullets) && p.bullets[0] ? String(p.bullets[0]).slice(0, 100) : undefined,
      topics: Array.isArray(p.technologies) ? (p.technologies as string[]).slice(0, 3) : ['Architecture'],
    }));

    const rawExp = Array.isArray(data.experience) ? (data.experience as Record<string, unknown>[]) : [];
    const experience = rawExp.slice(0, 2).map((e) => ({
      role: String(e.title || e.role || 'Software Engineer'),
      company: String(e.company || 'Tech'),
      technologies: Array.isArray(e.technologies) ? (e.technologies as string[]).slice(0, 4) : [],
      responsibilities: Array.isArray(e.bullets) ? (e.bullets as string[]).slice(0, 2).map((b: string) => String(b).slice(0, 100)) : [],
    }));

    return {
      summary: String(data.summary || 'Aspiring Software Engineer').slice(0, 200),
      skills: Array.from(new Set([...skills, ...technologies])).slice(0, INTERVIEW_LIMITS.maxResumeSkills),
      technologies,
      projects,
      experience,
    };
  }

  /**
   * Builds a compact job interview profile from opportunity entity.
   */
  static buildCompactJobProfile(opportunity: { title?: string; description?: string | null; requirements?: string | null; company?: { name?: string } } | null): JobInterviewProfile | undefined {
    if (!opportunity) return undefined;

    const desc = (opportunity.description || '').toLowerCase();
    const reqs = (opportunity.requirements || '').toLowerCase();

    // Standard skill extractors
    const commonTechs = [
      'react', 'next.js', 'node.js', 'typescript', 'javascript', 'python', 'java', 'go',
      'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'gcp',
      'system design', 'rest api', 'graphql', 'ci/cd', 'microservices'
    ];

    const foundSkills = commonTechs.filter((tech) => desc.includes(tech) || reqs.includes(tech));
    const coreSkills = foundSkills.slice(0, 6);
    const secondarySkills = foundSkills.slice(6, 12);

    return {
      role: opportunity.title || 'Software Engineer',
      company: opportunity.company?.name || undefined,
      coreSkills: coreSkills.length > 0 ? coreSkills : ['Problem Solving', 'Data Structures', 'System Design'],
      secondarySkills,
      technologies: coreSkills,
      interviewTopics: [...coreSkills, 'Scalability', 'Testing', 'API Design'],
      behavioralTraits: ['Communication', 'Ownership', 'Collaboration'],
      priorityAreas: coreSkills.map((s, idx) => ({ topic: s, priority: 10 - idx })),
    };
  }

  /**
   * Compresses an evaluated answer into compact summary tokens.
   */
  static compressAnswer(
    topic: string,
    evaluation: AnswerEvaluationPayload
  ): CompactAnswerSummary {
    return {
      topic,
      score: evaluation.score,
      strength: evaluation.strengths[0] || 'Good clarity',
      weakness: evaluation.weaknesses[0] || 'Lacks deep trade-off analysis',
      missingConcept: evaluation.missingConcepts?.[0] || 'Core principles',
    };
  }

  /**
   * Retrieves or builds candidate interview memory across recent sessions.
   */
  static async getCandidateMemory(userId: string): Promise<CandidateInterviewMemory> {
    const recentSessions = await prisma.interviewSession.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        questions: {
          include: {
            evaluation: true,
          },
        },
      },
    });

    const skillScores: Record<string, number> = {};
    const strongAreasSet = new Set<string>();
    const weakAreasSet = new Set<string>();
    const repeatedWeaknessesCounts: Record<string, number> = {};
    const recentTopics: string[] = [];
    const projectClaimsTested: string[] = [];
    const recentlyAskedQuestionIds: string[] = [];

    recentSessions.forEach((sess) => {
      sess.questions.forEach((q) => {
        recentlyAskedQuestionIds.push(q.id);
        recentTopics.push(q.category);

        if (q.evaluation) {
          q.evaluation.strengths.forEach((s) => strongAreasSet.add(s));
          q.evaluation.weaknesses.forEach((w) => {
            weakAreasSet.add(w);
            repeatedWeaknessesCounts[w] = (repeatedWeaknessesCounts[w] || 0) + 1;
          });
        }
      });
    });

    const repeatedWeaknesses = Object.entries(repeatedWeaknessesCounts)
      .filter(([, count]) => count >= 2)
      .map(([w]) => w);

    return {
      skillScores,
      strongAreas: Array.from(strongAreasSet).slice(0, 5),
      weakAreas: Array.from(weakAreasSet).slice(0, 5),
      repeatedWeaknesses: repeatedWeaknesses.slice(0, 4),
      recentTopics: Array.from(new Set(recentTopics)).slice(0, 6),
      projectClaimsTested: Array.from(new Set(projectClaimsTested)),
      recentlyAskedQuestionIds: recentlyAskedQuestionIds.slice(0, 10),
    };
  }

  /**
   * Updates longitudinal candidate skill profile in CareerAnalysis.
   */
  static async updateLongitudinalSkillMemory(
    userId: string,
    completedEvaluations: AnswerEvaluationPayload[],
    sessionCategorySkills: { skill: string; score: number }[]
  ): Promise<void> {
    try {
      const careerAnalysis = await prisma.careerAnalysis.findUnique({
        where: { userId },
      });

      if (!careerAnalysis) return;

      // Extract existing longitudinal records from careerPaths JSON field or initialize
      let skillRecords: Record<string, LongitudinalSkillRecord> = {};
      if (careerAnalysis.careerPaths && typeof careerAnalysis.careerPaths === 'object') {
        const stored = (careerAnalysis.careerPaths as Record<string, unknown>).longitudinalSkills;
        if (stored && typeof stored === 'object') {
          skillRecords = stored as Record<string, LongitudinalSkillRecord>;
        }
      }

      sessionCategorySkills.forEach(({ skill, score }) => {
        const normalizedSkill = skill.toLowerCase().trim();
        const existing = skillRecords[normalizedSkill];

        if (existing) {
          const newCount = existing.attemptCount + 1;
          const newAvg = Math.round(((existing.averageScore * existing.attemptCount) + score) / newCount);
          const trend: 'improving' | 'steady' | 'weak' =
            score >= existing.averageScore + 5
              ? 'improving'
              : score <= existing.averageScore - 5
              ? 'weak'
              : 'steady';

          skillRecords[normalizedSkill] = {
            skill,
            averageScore: newAvg,
            recentScore: score,
            attemptCount: newCount,
            trend,
            lastTested: new Date().toISOString(),
          };
        } else {
          skillRecords[normalizedSkill] = {
            skill,
            averageScore: score,
            recentScore: score,
            attemptCount: 1,
            trend: 'steady',
            lastTested: new Date().toISOString(),
          };
        }
      });

      // Persist safely in CareerAnalysis as JSON
      const updatedCareerPaths = JSON.parse(JSON.stringify({
        ...(typeof careerAnalysis.careerPaths === 'object' && careerAnalysis.careerPaths !== null
          ? (careerAnalysis.careerPaths as Record<string, unknown>)
          : {}),
        longitudinalSkills: skillRecords,
      }));

      await prisma.careerAnalysis.update({
        where: { userId },
        data: {
          careerPaths: updatedCareerPaths,
        },
      });
    } catch (err) {
      console.warn('[InterviewMemoryService] Failed to update longitudinal skill memory:', err);
    }
  }

  /**
   * Retrieves candidate's longitudinal skill records.
   */
  static async getLongitudinalSkills(userId: string): Promise<LongitudinalSkillRecord[]> {
    const careerAnalysis = await prisma.careerAnalysis.findUnique({
      where: { userId },
    });

    if (careerAnalysis?.careerPaths && typeof careerAnalysis.careerPaths === 'object') {
      const stored = (careerAnalysis.careerPaths as Record<string, unknown>).longitudinalSkills;
      if (stored && typeof stored === 'object') {
        return Object.values(stored as Record<string, LongitudinalSkillRecord>);
      }
    }
    return [];
  }
}
