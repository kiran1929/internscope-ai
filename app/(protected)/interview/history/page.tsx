import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { History, ArrowLeft, ArrowRight, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterviewHistoryPage() {
  const user = await getAuthenticatedUser();

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      sessionLength: true,
      difficulty: true,
      overallScore: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 animate-fade-in text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/interview" className="p-1.5 rounded-lg border border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold font-display flex items-center gap-1.5">
              <History className="w-5 h-5 text-zinc-400" /> Mock Interview Logs
            </h2>
            <p className="text-[11px] text-zinc-500">Review all previously attempted sessions and AI-graded feedback.</p>
          </div>
        </div>
      </div>

      {/* Logs list */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
        {sessions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Brain className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-xs text-zinc-550">No mock interview practice sessions found. Go to the setup dashboard to start one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((item) => (
              <Link
                key={item.id}
                href={`/interview/${item.id}`}
                className="flex justify-between items-center p-3 rounded-lg border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 hover:border-zinc-800 transition-all cursor-pointer block"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200 block truncate">{item.title}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {item.sessionLength} questions • {item.difficulty} • {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'COMPLETED' ? (
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                      {item.overallScore}%
                    </span>
                  ) : (
                    <span className="text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-[9px] font-mono">
                      Incomplete
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-650" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
