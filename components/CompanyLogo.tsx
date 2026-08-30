'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  getCompanyLogoFallbackUrls,
  isHttpUrl,
  isLegacyBrandCode,
  resolveCompanyLogoUrl,
} from '@/lib/company-logo-utils';

interface CompanyLogoProps {
  /** URL, legacy brand code (e.g. MSFT), or initials key */
  logo?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  applicationUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs rounded',
  md: 'w-10 h-10 text-sm rounded-lg',
  lg: 'w-14 h-14 text-lg rounded-xl',
};

function getBrandDetails(brand: string, name: string) {
  switch (brand.toUpperCase()) {
    case 'MSFT':
      return {
        bg: 'bg-zinc-900 border border-zinc-800',
        element: (
          <div className="grid grid-cols-2 gap-[2px] w-1/2 h-1/2">
            <span className="bg-[#F25022]" />
            <span className="bg-[#7FBA00]" />
            <span className="bg-[#00A4EF]" />
            <span className="bg-[#FFB900]" />
          </div>
        ),
      };
    case 'GOOG':
      return {
        bg: 'bg-zinc-950 border border-zinc-800',
        element: (
          <div className="relative flex items-center justify-center w-full h-full">
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#EA4335] border-r-[#4285F4] border-b-[#34A853] border-l-[#FBBC05]" />
            <span className="font-bold text-white text-[50%]">G</span>
          </div>
        ),
      };
    case 'AAPL':
      return {
        bg: 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-700',
        element: <span className="font-semibold text-black dark:text-white"></span>,
      };
    case 'AMZN':
      return {
        bg: 'bg-zinc-900 border border-[#FF9900]/20',
        element: (
          <div className="flex flex-col items-center justify-center font-bold text-white leading-none">
            <span className="text-[60%]">a</span>
            <span className="text-[#FF9900] text-[50%] -mt-1">➔</span>
          </div>
        ),
      };
    case 'META':
      return {
        bg: 'bg-gradient-to-r from-[#0064E0] to-[#007DFE] border border-blue-500/20',
        element: <span className="font-extrabold text-white text-[60%] tracking-tighter">∞</span>,
      };
    case 'NVDA':
      return {
        bg: 'bg-zinc-900 border border-[#76B900]/30',
        element: <span className="font-bold text-[#76B900] tracking-tighter text-[55%]">NVIDIA</span>,
      };
    case 'OPENAI':
      return {
        bg: 'bg-zinc-900 border border-emerald-500/20',
        element: (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400 stroke-current" fill="none" strokeWidth="1.5">
            <path d="M12 3v18M3 12h18m-4.5-7.5l-9 9m9 0l-9-9" strokeLinecap="round" />
          </svg>
        ),
      };
    case 'STRIPE':
      return {
        bg: 'bg-gradient-to-br from-[#635BFF] to-[#0A2540] border border-indigo-500/20',
        element: <span className="font-black text-white italic text-[70%]">S</span>,
      };
    case 'NFLX':
      return {
        bg: 'bg-black border border-red-800/30',
        element: <span className="font-black text-[#E50914] text-lg">N</span>,
      };
    default: {
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return {
        bg: 'bg-surface-muted border border-border-subtle',
        element: <span className="font-semibold text-text-muted text-[80%]">{initials || '?'}</span>,
      };
    }
  }
}

const GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-violet-600 to-purple-600',
  'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
  'from-cyan-600 to-blue-600',
  'from-fuchsia-600 to-pink-600',
  'from-indigo-600 to-cyan-600',
];

function getDeterministicGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logo,
  logoUrl,
  websiteUrl,
  applicationUrl,
  name,
  size = 'md',
}) => {
  const sourceInput = useMemo(
    () => ({
      logoUrl: logoUrl ?? (isHttpUrl(logo) ? logo : null),
      websiteUrl,
      applicationUrl,
      companyName: name,
    }),
    [logo, logoUrl, websiteUrl, applicationUrl, name]
  );

  const primaryUrl = useMemo(() => resolveCompanyLogoUrl(sourceInput), [sourceInput]);
  const fallbackUrls = useMemo(() => getCompanyLogoFallbackUrls(sourceInput), [sourceInput]);

  const useLegacyBrand = !!logo && isLegacyBrandCode(logo) && !isHttpUrl(logo) && !primaryUrl;

  const imageCandidates = useMemo(() => {
    const urls = [primaryUrl, ...fallbackUrls].filter(Boolean) as string[];
    return [...new Set(urls)];
  }, [primaryUrl, fallbackUrls]);

  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageIndex(0);
    setImageFailed(false);
  }, [imageCandidates.join('|')]);

  if (useLegacyBrand) {
    const brand = getBrandDetails(logo!, name);
    return (
      <div
        className={`flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} ${brand.bg}`}
        aria-label={`${name} Logo`}
      >
        {brand.element}
      </div>
    );
  }

  const activeImage = !imageFailed && imageCandidates[imageIndex];

  if (activeImage) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} bg-white dark:bg-white rounded-xl shadow-xs ring-1 ring-black/10`}
        aria-label={`${name} Logo`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imageIndex < imageCandidates.length - 1) {
              setImageIndex((i) => i + 1);
            } else {
              setImageFailed(true);
            }
          }}
        />
      </div>
    );
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const gradient = getDeterministicGradient(name);

  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden font-bold text-white shadow-xs rounded-xl bg-gradient-to-br ${gradient} ${sizeClasses[size]}`}
      aria-label={`${name} Logo`}
    >
      <span className="text-[75%] tracking-tight font-extrabold">{initials || name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
};

export default CompanyLogo;
