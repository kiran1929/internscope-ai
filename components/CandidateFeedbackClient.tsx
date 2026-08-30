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
    <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 space-y-5 shadow-2xs text-foreground font-sans">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
        <MessageSquare className="w-4.5 h-4.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Beta Feedback Studio</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        
        {/* Type Select */}
        <div className="space-y-1.5">
          <label className="text-text-muted font-bold block text-xs">Feedback Category</label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['GENERAL', 'BUG', 'FEATURE_REQUEST', 'AI_RATING'] as const).map(t => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] tracking-tight uppercase transition-all cursor-pointer ${
                  type === t
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                    : 'border-border-subtle bg-input-bg text-text-muted hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                {t === 'FEATURE_REQUEST' ? 'Feature' : t === 'AI_RATING' ? 'AI Rating' : t.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Star Selector if AI_RATING */}
        {type === 'AI_RATING' && (
          <div className="space-y-1.5">
            <label className="text-text-muted font-bold block text-xs">Rate AI Response Quality</label>
            <div className="flex gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-text-muted/40'}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content text */}
        <div className="space-y-1.5">
          <label className="text-text-muted font-bold block text-xs">Describe your experience / bug report</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'BUG'
                ? 'Include steps to reproduce or where you encountered the exception...'
                : type === 'FEATURE_REQUEST'
                ? 'What tool or enhancement would speed up your workflow?'
                : 'Share any feedback or improvement suggestions...'
            }
            rows={3}
            className="w-full bg-input-bg border border-border-subtle rounded-xl p-3 text-xs text-foreground placeholder:text-text-muted/60 outline-none focus:border-primary transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}
