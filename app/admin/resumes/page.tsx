import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import {
  FileText,
  Clock,
  Award,
  AlertTriangle,
  TrendingUp,
  Coins,
  Brain,
  CheckCircle,
  Activity,
  Compass,
  Briefcase,
  GitBranch,
  Play
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminResumeAnalyticsPage() {
  await getAdminUser();

  // 1. Fetch database aggregates across Resumes, Matches, Career, and Interviews
  const [
    totalResumes,
    parsedResumesCount,
    avgParseTimeResult,
    avgMatchScoreResult,
    parserFailures,
    totalTokensResult,
    allParsedResumes,
    allJobMatches,
    
    // Career analysis metrics
    totalCareerAnalyses,
    avgCareerScoreResult,
    avgCareerLatencyResult,
    totalCareerTokensResult,
    totalCareerCostResult,
    allCareerAnalyses,
    allRoadmaps,

    // Interview metrics
    totalMockSessions,
    completedMockSessionsCount,
    avgInterviewScoreResult,
    avgInterviewLatencyResult,
    totalInterviewTokensResult,
    totalInterviewCostResult,
    allEvaluations,
    allSummaries,
  ] = await Promise.all([
    prisma.resume.count(),
    prisma.resume.count({ where: { isParsed: true } }),
    prisma.resume.aggregate({
      where: { isParsed: true },
      _avg: { processingTimeMs: true },
    }),
    prisma.jobMatch.aggregate({
      _avg: { overallScore: true },
    }),
    prisma.resume.count({
      where: {
        isParsed: false,
        parsingError: { not: null },
      },
    }),
    prisma.resume.aggregate({
      _sum: { tokensConsumed: true },
    }),
    prisma.resume.findMany({
      where: { isParsed: true },
      select: { structuredData: true },
    }),
    prisma.jobMatch.findMany({
      select: { missingSkills: true, missingTechnologies: true },
    }),
    
    // Career aggregates
    prisma.careerAnalysis.count(),
    prisma.careerAnalysis.aggregate({
      _avg: { careerScore: true },
    }),
    prisma.careerAnalysis.aggregate({
      _avg: { latencyMs: true },
    }),
    prisma.careerAnalysis.aggregate({
      _sum: { tokensUsed: true },
    }),
    prisma.careerAnalysis.aggregate({
      _sum: { estimatedCost: true },
    }),
    prisma.careerAnalysis.findMany({
      select: { careerPaths: true },
    }),
    prisma.learningRoadmap.findMany({
      select: { skillName: true },
    }),

    // Interview aggregates
    prisma.interviewSession.count(),
    prisma.interviewSession.count({ where: { status: 'COMPLETED' } }),
    prisma.interviewSession.aggregate({
      where: { status: 'COMPLETED' },
      _avg: { overallScore: true },
    }),
    prisma.interviewSummary.aggregate({
      _avg: { latencyMs: true },
    }),
    prisma.interviewSummary.aggregate({
      _sum: { tokensUsed: true },
    }),
    prisma.interviewSummary.aggregate({
      _sum: { estimatedCost: true },
    }),
    prisma.interviewEvaluation.findMany({
      select: { strengths: true, weaknesses: true, tokensUsed: true },
    }),
    prisma.interviewSummary.findMany({
      select: { keyStrengths: true, keyWeaknesses: true },
    }),
  ]);

  // 2. Calculations
  const avgParseTimeSec = Math.round(((avgParseTimeResult._avg.processingTimeMs || 0) / 1000) * 10) / 10;
  const avgMatchScore = Math.round(avgMatchScoreResult._avg.overallScore || 0);
  const totalResumeTokens = totalTokensResult._sum.tokensConsumed || 0;
  const estimatedResumeCost = totalResumeTokens * 0.00000015;

  const avgCareerScore = Math.round(avgCareerScoreResult._avg.careerScore || 0);
  const avgCareerLatencySec = Math.round(((avgCareerLatencyResult._avg.latencyMs || 0) / 1000) * 10) / 10;
  const totalCareerTokens = totalCareerTokensResult._sum.tokensUsed || 0;
  const totalCareerCost = totalCareerCostResult._sum.estimatedCost || 0;

  // Interview metrics calculations
  const avgInterviewScore = Math.round(avgInterviewScoreResult._avg.overallScore || 0);
  const avgInterviewLatencySec = Math.round(((avgInterviewLatencyResult._avg.latencyMs || 0) / 1000) * 10) / 10;
  const totalSummaryTokens = totalInterviewTokensResult._sum.tokensUsed || 0;
  const totalEvalTokens = allEvaluations.reduce((acc, ev) => acc + (ev.tokensUsed || 0), 0);
  const totalInterviewTokens = totalSummaryTokens + totalEvalTokens;
  const totalSummaryCost = totalInterviewCostResult._sum.estimatedCost || 0;
  const estimatedEvalCost = totalEvalTokens * 0.00000015;
  const totalInterviewCost = totalSummaryCost + estimatedEvalCost;

  // Combined metrics
  const combinedTokens = totalResumeTokens + totalCareerTokens + totalInterviewTokens;
  const combinedCost = Math.round((estimatedResumeCost + totalCareerCost + totalInterviewCost) * 10000) / 10000;
  const avgSystemLatencySec = Math.round(((avgParseTimeSec + avgCareerLatencySec + avgInterviewLatencySec) / 3) * 10) / 10;

  // 3. Most Common Skills Extraction
  const skillCounts: Record<string, number> = {};
  allParsedResumes.forEach((r) => {
    const data = r.structuredData as any;
    if (data && Array.isArray(data.skills)) {
      data.skills.forEach((s: string) => {
        const key = s.trim();
        if (key) {
          skillCounts[key] = (skillCounts[key] || 0) + 1;
        }
      });
    }
  });

  const mostCommonSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Most Missing Skills / Tech gaps Extraction
  const missingSkillCounts: Record<string, number> = {};
  allJobMatches.forEach((m) => {
    if (Array.isArray(m.missingSkills)) {
      m.missingSkills.forEach((s: string) => {
        const key = s.trim();
        if (key) {
          missingSkillCounts[key] = (missingSkillCounts[key] || 0) + 1;
        }
      });
    }
    if (Array.isArray(m.missingTechnologies)) {
      m.missingTechnologies.forEach((t: string) => {
        const key = t.trim();
        if (key) {
          missingSkillCounts[key] = (missingSkillCounts[key] || 0) + 1;
        }
      });
    }
  });

  const mostMissingSkills = Object.entries(missingSkillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Top Recommended Skills (from Roadmaps count)
  const roadmapSkillCounts: Record<string, number> = {};
  allRoadmaps.forEach((r) => {
    const key = r.skillName.trim();
    if (key) {
      roadmapSkillCounts[key] = (roadmapSkillCounts[key] || 0) + 1;
    }
  });

  const topRecommendedSkills = Object.entries(roadmapSkillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 6. Most Common Career Paths
  const careerPathCounts: Record<string, number> = {};
  allCareerAnalyses.forEach((ca) => {
    const paths = ca.careerPaths as any;
    if (Array.isArray(paths)) {
      paths.forEach((p: any) => {
        const key = p.title?.trim();
        if (key) {
          careerPathCounts[key] = (careerPathCounts[key] || 0) + 1;
        }
      });
    }
  });

  const mostCommonCareerPaths = Object.entries(careerPathCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 7. Most Difficult Skills / Missed Topics (from mock evaluations weaknesses)
  const interviewWeaknessCounts: Record<string, number> = {};
  allEvaluations.forEach((ev) => {
    ev.weaknesses.forEach((w) => {
      // clean up and extract key topic/skill words
      const cleanW = w.replace(/^(Lacks|Needs|Failed to)\s+/i, '').trim();
      if (cleanW) {
        interviewWeaknessCounts[cleanW] = (interviewWeaknessCounts[cleanW] || 0) + 1;
      }
    });
  });

  const mostMissedTopics = Object.entries(interviewWeaknessCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const cards = [
    { label: 'Mock Sessions', value: totalMockSessions, desc: `${completedMockSessionsCount} Completed runs`, icon: Play, color: 'text-primary border-primary/20 bg-primary/5' },
    { label: 'Avg Interview Score', value: `${avgInterviewScore}%`, desc: 'Average mock test performance', icon: Award, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { label: 'Combined AI Cost', value: `$${combinedCost}`, desc: 'Estimated Gemini spend', icon: Coins, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { label: 'Cumulative Tokens', value: combinedTokens.toLocaleString(), desc: 'Platform consumption usage', icon: Brain, color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
    { label: 'Avg System Latency', value: `${avgSystemLatencySec}s`, desc: 'Average processing duration', icon: Clock, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Avg Career Score', value: `${avgCareerScore}/100`, desc: `${totalCareerAnalyses} Profiles analyzed`, icon: TrendingUp, color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          AI Career & Interview Analytics CMS
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Monitor platforms mock interviews, candidate score aggregations, system latencies, and total token usage profiles.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#111113] border border-zinc-850 rounded-xl p-4 hover:border-zinc-800 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                <p className="text-[9px] text-text-muted mt-0.5 font-semibold">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lists Row 1: Gaps vs Recommended Roadmaps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Most Missing Skills (Gaps) */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Most Missing Job Skills</h3>
          </div>

          <div className="space-y-4 pt-1">
            {mostMissingSkills.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No job match gap data recorded.</p>
            ) : (
              mostMissingSkills.map((item, idx) => {
                const totalMatches = allJobMatches.length || 1;
                const pct = Math.round((item.count / totalMatches) * 100);
                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-bold flex items-center gap-2">
                        <span className="text-zinc-650 font-mono">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-zinc-400 font-semibold font-mono">
                        {item.count} fits missing ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Recommended Roadmap Skills */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Compass className="w-4.5 h-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Top Recommended Skills</h3>
          </div>

          <div className="space-y-4 pt-1">
            {topRecommendedSkills.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No learning roadmaps generated yet.</p>
            ) : (
              topRecommendedSkills.map((item, idx) => {
                const totalAnalyses = totalCareerAnalyses || 1;
                const pct = Math.round((item.count / totalAnalyses) * 100);
                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-bold flex items-center gap-2">
                        <span className="text-zinc-650 font-mono">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-zinc-400 font-semibold font-mono">
                        {item.count} roadmaps ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Missed Mock Interview Topics */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Most Missed Topics</h3>
          </div>

          <div className="space-y-4 pt-1">
            {mostMissedTopics.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No mock interview failures recorded yet.</p>
            ) : (
              mostMissedTopics.map((item, idx) => {
                const totalEvals = allEvaluations.length || 1;
                const pct = Math.round((item.count / totalEvals) * 100);
                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-bold flex items-center gap-2 truncate max-w-[130px]" title={item.name}>
                        <span className="text-zinc-650 font-mono">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-zinc-400 font-semibold font-mono">
                        {item.count} times ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Lists Row 2: Common Career Paths vs Common Candidate Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Most Common Career Paths */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <GitBranch className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Top Recommended Career Paths</h3>
          </div>

          <div className="space-y-3.5 pt-1 text-xs">
            {mostCommonCareerPaths.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No career path recommendations computed yet.</p>
            ) : (
              mostCommonCareerPaths.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between py-1 border-b border-zinc-900 last:border-none">
                  <span className="text-zinc-200 font-bold flex items-center gap-2">
                    <span className="text-zinc-650 font-mono">#{idx + 1}</span>
                    <span>{item.name}</span>
                  </span>
                  <span className="text-primary font-bold px-2 py-0.5 rounded border border-primary/20 bg-primary/5 font-mono">
                    {item.count} recommendations
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Common Extracted Skills */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <CheckCircle className="w-4.5 h-4.5 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Top Candidate Strengths</h3>
          </div>

          <div className="space-y-4 pt-1">
            {mostCommonSkills.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No parsed skills index recorded.</p>
            ) : (
              mostCommonSkills.map((item, idx) => {
                const pct = parsedResumesCount > 0 ? Math.round((item.count / parsedResumesCount) * 100) : 0;
                return (
                  <div key={item.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-bold flex items-center gap-2">
                        <span className="text-zinc-650 font-mono">#{idx + 1}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-zinc-400 font-semibold font-mono">
                        {item.count} profiles ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Observability footer card */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-xl flex items-start gap-3">
        <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-zinc-450">
          <span className="font-bold text-white block">Observability & Platform Health Overview</span>
          <p className="leading-relaxed">
            AI overhead costs are aggregated across both the Resume Parsing, Career Intelligence, and Mock Interview engines. Failure triggers are monitored via the Trigger.dev dashboard workspace. The database maintains full version control over snapshots to optimize data footprints.
          </p>
        </div>
      </div>

    </div>
  );
}
