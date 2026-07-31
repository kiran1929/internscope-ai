'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('internscope_cookie_consent');
    if (!consent) {
      // Small timeout to animate banner in
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('internscope_cookie_consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-[#111113] border border-zinc-800 rounded-xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-350 text-white font-sans text-xs select-none leading-relaxed space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-200 block">Cookie Consent notice</span>
            <p className="text-[10px] text-zinc-400">
              We use cookies to authenticate profile configurations, optimize ATS resume grades, and track product adoption statistics.
            </p>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-zinc-650 hover:text-white p-0.5"
          aria-label="Close Notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-end gap-2 text-[9px] font-bold uppercase">
        <button
          onClick={() => setVisible(false)}
          className="px-2.5 py-1 bg-transparent hover:bg-zinc-900 border border-zinc-850 rounded text-zinc-400"
        >
          Dismiss
        </button>
        <button
          onClick={handleAccept}
          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white rounded shadow-sm shadow-primary/10"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
