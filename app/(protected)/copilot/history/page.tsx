import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { History, ArrowLeft, Brain, Calendar, Activity, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CopilotHistoryPage() {
  const user = await getAuthenticatedUser();

  const reports = await prisma.weeklyCareerReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-fade-in text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/copilot" className="p-1.5 rounded-lg border border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold font-display flex items-center gap-1.5">
              <History className="w-5 h-5 text-zinc-400" /> Weekly Career Reports
            </h2>
            <p className="text-[11px] text-zinc-500">Review all generated weekly career snapshots and recommended progression goals.</p>
          </div>
        </div>
      </div>

      {/* Reports history timeline */}
      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center space-y-2">
            <Brain className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-xs text-zinc-550">No weekly career performance reports compiled yet.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm text-xs font-sans leading-relaxed">
              
              {/* Date Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Report: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className="text-zinc-500">Delta Score:</span>
                  <span className={report.careerScoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {report.careerScoreDelta >= 0 ? '+' : ''}{report.careerScoreDelta} Rating
                  </span>
                </div>
              </div>

              {/* Progress details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Resume Progress:</span>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[10px]">
                    {report.resumeImprovements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                  </ul>

                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block pt-2">Skills Focused:</span>
                  <div className="flex flex-wrap gap-1">
                    {report.skillsLearned.map(s => (
                      <span key={s} className="text-[8px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 text-zinc-400">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-900 pt-4 md:pt-0 md:pl-6">
                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Mock Interviews:</span>
                  <p className="text-[10px] text-zinc-300">{report.interviewProgress}</p>

                  <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block pt-2">New matching positions:</span>
                  <span className="text-[10px] text-emerald-400 font-bold block">{report.newMatchingJobsCount} opportunities matching your profile</span>
                </div>
              </div>

              {/* Recommendations checklist */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-3 rounded-lg space-y-2 leading-relaxed">
                <span className="font-bold text-zinc-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> AI Strategic Recommendations
                </span>
                <ul className="list-decimal pl-4 space-y-1 text-zinc-400 text-[10px]">
                  {report.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
