import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getAuthenticatedUser();

  const [
    totalApps,
    interviewingApps,
    offeredApps,
    jobMatches,
    industryCounts,
  ] = await Promise.all([
    prisma.application.count({ where: { userId: user.id } }),
    prisma.application.count({ where: { userId: user.id, status: 'INTERVIEW' } }),
    prisma.application.count({ where: { userId: user.id, status: 'OFFER' } }),
    prisma.jobMatch.findMany({
      where: {
        resume: { userId: user.id }
      },
      select: { overallScore: true }
    }),
    prisma.opportunity.findMany({
      where: { isArchived: false, isActive: true },
      select: {
        company: {
          select: { industry: true }
        }
      }
    }),
  ]);

  const responseRate = totalApps > 0 ? Math.round(((offeredApps + interviewingApps) / totalApps) * 100) : 0;
  const interviewConversion = interviewingApps > 0 ? Math.round((offeredApps / interviewingApps) * 100) : 0;

  const averageMatchRate = jobMatches.length > 0
    ? Math.round(jobMatches.reduce((acc, m) => acc + m.overallScore, 0) / jobMatches.length)
    : 75;

  const matches = jobMatches.map(m => m.overallScore);
  const scoreBins = {
    fiftyToSixty: matches.filter(s => s >= 50 && s < 60).length,
    sixtyToSeventy: matches.filter(s => s >= 60 && s < 70).length,
    seventyToEighty: matches.filter(s => s >= 70 && s < 80).length,
    eightyToNinety: matches.filter(s => s >= 80 && s < 90).length,
    ninetyToNinetyFive: matches.filter(s => s >= 90 && s < 95).length,
    ninetyFiveToHundred: matches.filter(s => s >= 95 && s <= 100).length,
  };

  const sectorMap: Record<string, number> = {};
  let totalSectorCount = 0;
  industryCounts.forEach(o => {
    const ind = o.company.industry || 'Tech & Engineering';
    sectorMap[ind] = (sectorMap[ind] || 0) + 1;
    totalSectorCount++;
  });

  const sectorDistribution = Object.entries(sectorMap)
    .map(([name, count]) => {
      const percent = totalSectorCount > 0 ? Math.round((count / totalSectorCount) * 100) : 0;
      return { name, count, percent };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (sectorDistribution.length === 0) {
    sectorDistribution.push(
      { name: 'Artificial Intelligence', count: 0, percent: 0 },
      { name: 'Enterprise Cloud Systems', count: 0, percent: 0 },
      { name: 'Financial Tech (Fintech)', count: 0, percent: 0 },
      { name: 'Developer Tooling & DevOps', count: 0, percent: 0 }
    );
  }

  const signupDate = user.createdAt || new Date();
  const daysActive = Math.max(1, Math.ceil((Date.now() - new Date(signupDate).getTime()) / (1000 * 3600 * 24)));

  return (
    <DashboardAnalytics
      responseRate={responseRate}
      interviewConversion={interviewConversion}
      averageMatchRate={averageMatchRate}
      daysActive={daysActive}
      scoreBins={scoreBins}
      sectorDistribution={sectorDistribution}
    />
  );
}
