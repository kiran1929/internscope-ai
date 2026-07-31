'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { submitFeedbackAction } from '@/app/actions/feedback';
import { Loader2, MessageSquare, Star, Sparkles, Send } from 'lucide-react';

export default function CandidateFeedbackClient() {
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<'BUG' | 'FEATURE_REQUEST' | 'GENERAL' | 'AI_RATING'>('GENERAL');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.warning('Please enter a feedback description message.');
      return;
    }

    startTransition(async () => {
      const res = await submitFeedbackAction({
        type,
        content,
        rating: type === 'AI_RATING' ? rating : undefined,
      });

      if (res.success) {
        toast.success('Thank you for your feedback! The beta team has logged your submission.');
        setContent('');
        setRating(5);
      } else {
        toast.error(`Submission failed: ${res.error}`);
      }
    });
  };

  return (
    <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-md text-white select-none">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <MessageSquare className="w-4.5 h-4.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Beta Feedback Studio</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        
        {/* Type Select */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-bold block">Feedback Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {(['GENERAL', 'BUG', 'FEATURE_REQUEST', 'AI_RATING'] as const).map(t => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`py-1.5 px-2 rounded-lg border text-center font-bold tracking-tight uppercase ${
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-850 bg-zinc-900/40 text-zinc-450 hover:bg-zinc-900'
                }`}
              >
                {t === 'FEATURE_REQUEST' ? 'Feature' : t === 'AI_RATING' ? 'AI Rating' : t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Star Selector if AI_RATING */}
        {type === 'AI_RATING' && (
          <div className="space-y-1">
            <label className="text-zinc-400 font-bold block">Rate AI Response Quality</label>
            <div className="flex gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content text */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-bold block">Describe your experience / bug report</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'BUG'
                ? 'Include steps to reproduce or where you encountered the exception...'
                : type === 'FEATURE_REQUEST'
                ? 'What tool or enhancement would speed up your workflow?'
                : 'Write your general feedback suggestions here...'
            }
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-zinc-700 leading-normal"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-primary/10"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Submit Feedback</span>
        </button>

      </form>

    </div>
  );
}
