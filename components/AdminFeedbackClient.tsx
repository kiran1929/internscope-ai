'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toggleFeedbackResolvedAction } from '@/app/actions/feedback';
import { Star, CheckCircle, Clock, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FeedbackItem {
  id: string;
  userId: string | null;
  type: string;
  content: string;
  rating: number | null;
  isResolved: boolean;
  createdAt: Date;
}

interface AdminFeedbackClientProps {
  initialFeedback: FeedbackItem[];
}

export default function AdminFeedbackClient({
  initialFeedback,
}: AdminFeedbackClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filter, setFilter] = useState<'ALL' | 'BUG' | 'FEATURE_REQUEST' | 'AI_RATING' | 'UNRESOLVED'>('ALL');

  const handleToggleResolve = (id: string, active: boolean) => {
    startTransition(async () => {
      const res = await toggleFeedbackResolvedAction(id, active);
      if (res.success) {
        toast.success(active ? 'Feedback marked as resolved.' : 'Feedback marked as unresolved.');
        router.refresh();
      } else {
        toast.error(`Update failed: ${res.error}`);
      }
    });
  };

  const filteredItems = initialFeedback.filter(item => {
    if (filter === 'UNRESOLVED') return !item.isResolved;
    if (filter !== 'ALL' && item.type !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-6 text-white font-sans text-xs">
      
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 p-3 border border-zinc-850 bg-[#111113] rounded-xl">
        {(['ALL', 'UNRESOLVED', 'BUG', 'FEATURE_REQUEST', 'AI_RATING'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-1.5 px-3 rounded-lg border font-bold uppercase tracking-tight ${
              filter === f
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-zinc-850 bg-zinc-900/40 text-zinc-450 hover:bg-zinc-900'
            }`}
          >
            {f === 'FEATURE_REQUEST' ? 'Features' : f === 'AI_RATING' ? 'Ratings' : f.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <p className="text-zinc-550 py-10 text-center md:col-span-2">No feedback records match the current filter selection.</p>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`border rounded-xl p-4 space-y-3 bg-[#111113] ${item.isResolved ? 'border-zinc-900 opacity-60' : 'border-zinc-850'}`}>
              
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    item.type === 'BUG'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : item.type === 'FEATURE_REQUEST'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block pt-1">{new Date(item.createdAt).toLocaleString()}</span>
                </div>

                <button
                  onClick={() => handleToggleResolve(item.id, !item.isResolved)}
                  disabled={isPending}
                  className={`px-3 py-1 rounded text-[10px] font-bold ${
                    item.isResolved
                      ? 'bg-zinc-900 text-zinc-500 border border-zinc-850'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {item.isResolved ? 'RESOLVED' : 'MARK RESOLVED'}
                </button>
              </div>

              <p className="text-[11px] text-zinc-250 leading-relaxed leading-normal">{item.content}</p>

              {item.rating && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-900/60">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">AI Rating:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= (item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-800'}`} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
