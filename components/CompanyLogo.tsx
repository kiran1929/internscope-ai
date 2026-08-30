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
  sm: 'w-7 h-7 text-xs rounded-lg',
  md: 'w-10 h-10 text-sm rounded-lg',
  lg: 'w-14 h-14 text-lg rounded-xl',
};

function getBrandDetails(brand: string, name: string) {
  switch (brand.toUpperCase()) {
    case 'MSFT':
      return {
        bg: 'bg-zinc-900/90 border border-zinc-800',
        element: (
          <div className="grid grid-cols-2 gap-[2.5px] w-3/5 h-3/5">
            <span className="bg-[#F25022] rounded-[0.5px]" />
            <span className="bg-[#7FBA00] rounded-[0.5px]" />
            <span className="bg-[#00A4EF] rounded-[0.5px]" />
            <span className="bg-[#FFB900] rounded-[0.5px]" />
          </div>
        ),
      };
    case 'GOOG':
      return {
        bg: 'bg-zinc-900/90 border border-zinc-800',
        element: (
          <svg className="w-3/5 h-3/5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        ),
      };
    case 'AAPL':
      return {
        bg: 'bg-zinc-900/90 border border-zinc-800',
        element: (
          <svg className="w-3/5 h-3/5 text-white fill-current" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.07-3.18-2.61-7.14-7.29-11.89-14.04-6.49-9.23-11.66-19.78-15.53-31.66-3.87-11.87-5.8-23.36-5.8-34.45 0-14.24 3.56-26.1 10.68-35.58 7.12-9.48 16.14-14.37 27.06-14.67 4.9 0 10.28 1.25 16.15 3.76 5.87 2.5 9.94 3.76 12.21 3.76 1.94 0 6.07-1.34 12.39-4.02 6.31-2.68 11.75-3.88 16.32-3.6 12.11.96 21.65 5.48 28.62 13.56-10.74 6.49-16.01 15.42-15.82 26.8.19 8.92 3.49 16.48 9.9 22.68 6.41 6.2 14.1 9.77 23.07 10.72-2.3 6.75-5.06 13.32-8.28 19.71zM119.22 31.09c0-7.39 2.65-14.4 7.95-21.03 5.3-6.63 11.97-10.06 20.01-10.06.19 1.15.29 2.11.29 2.88 0 7.39-2.68 14.5-8.04 21.33-5.36 6.83-12.12 10.37-20.28 10.62-.06-1.16-.09-2.11-.09-2.88z" />
          </svg>
        ),
      };
    case 'AMZN':
      return {
        bg: 'bg-zinc-900/90 border border-amber-500/20',
        element: (
          <div className="flex flex-col items-center justify-center font-bold text-white leading-none">
            <span className="text-xs font-black text-white">a</span>
            <svg className="w-3.5 h-1.5 text-amber-400 fill-current -mt-0.5" viewBox="0 0 30 10">
              <path d="M1 3 C 8 8, 22 8, 28 2" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M25 1 L29 2 L27 6 Z" fill="currentColor" />
            </svg>
          </div>
        ),
      };
    case 'META':
      return {
        bg: 'bg-zinc-900/90 border border-blue-500/20',
        element: (
          <svg className="w-3/5 h-3/5 text-blue-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 8.5c-2.3 0-4.3 1.5-5.2 3.6-1.3-2.7-3.9-4.6-7-4.6v3.2c2.2 0 4.1 1.3 4.9 3.2C3.8 15.8 1.9 17 0 17v3c3.1 0 5.7-1.9 7-4.6 1 2.1 3 3.6 5.3 3.6 3.4 0 6.2-2.8 6.2-6.2s-2.8-6.3-6.5-6.3zm0 9.5c-1.8 0-3.3-1.5-3.3-3.3s1.5-3.3 3.3-3.3 3.3 1.5 3.3 3.3-1.5 3.3-3.3 3.3z" />
          </svg>
        ),
      };
    case 'NVDA':
      return {
        bg: 'bg-zinc-900/90 border border-[#76B900]/30',
        element: (
          <span className="font-extrabold text-[#76B900] tracking-tighter text-[9px]">NVIDIA</span>
        ),
      };
    case 'OPENAI':
      return {
        bg: 'bg-zinc-900/90 border border-emerald-500/20',
        element: (
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-emerald-400 stroke-current" fill="none" strokeWidth="2">
            <path d="M12 3v18M3 12h18m-4.5-7.5l-9 9m9 0l-9-9" strokeLinecap="round" />
          </svg>
        ),
      };
    case 'STRIPE':
      return {
        bg: 'bg-gradient-to-br from-[#635BFF] to-[#0A2540] border border-indigo-500/30',
        element: <span className="font-black text-white italic text-xs tracking-wider">S</span>,
      };
    case 'NFLX':
      return {
        bg: 'bg-zinc-950 border border-red-900/40',
        element: <span className="font-black text-[#E50914] text-xs">N</span>,
      };
    case 'ADBE':
      return {
        bg: 'bg-[#FA0F00] border border-red-600/30',
        element: <span className="font-black text-white text-[10px] tracking-tight">A</span>,
      };
    case 'SPOT':
      return {
        bg: 'bg-zinc-900/90 border border-emerald-500/20',
        element: (
          <svg className="w-3/5 h-3/5 text-[#1DB954] fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.3.102zM18.96 14.1c-.3.479-.9.6-1.38.3-3.24-2-8.16-2.58-11.94-1.44-.54.18-1.14-.12-1.32-.66-.18-.54.12-1.14.66-1.32 4.32-1.32 9.78-.66 13.5 1.68.48.3.6.9.48 1.44zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.26-.18-1.44-.78-.18-.6.18-1.26.78-1.44 4.26-1.26 11.28-1 15.66 1.62.54.3.72 1.02.42 1.56-.3.48-1.02.66-1.5.36z" />
          </svg>
        ),
      };
    case 'DATABRICKS':
      return {
        bg: 'bg-zinc-900/90 border border-orange-500/20',
        element: (
          <svg className="w-3/5 h-3/5 text-[#FF3621] stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 3L2 8.5l10 5.5 10-5.5L12 3zM2 15.5l10 5.5 10-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      };
    case 'SNOW':
      return {
        bg: 'bg-zinc-900/90 border border-sky-500/20',
        element: (
          <svg className="w-3/5 h-3/5 text-[#29B5E8] stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" strokeLinecap="round" />
          </svg>
        ),
      };
    case 'NET':
      return {
        bg: 'bg-zinc-900/90 border border-orange-500/20',
        element: (
          <svg className="w-3/5 h-3/5 text-[#F38020] fill-current" viewBox="0 0 24 24">
            <path d="M16.5 10.5c-.3-2.5-2.4-4.5-5-4.5-2.2 0-4.1 1.5-4.7 3.6C4.8 10 3 11.8 3 14c0 2.5 2 4.5 4.5 4.5h11c2 0 3.5-1.5 3.5-3.5 0-2-1.5-3.5-3.5-3.5h-2z" />
          </svg>
        ),
      };
    case 'ANTH':
      return {
        bg: 'bg-zinc-900/90 border border-amber-600/20',
        element: <span className="font-extrabold text-amber-100 text-xs font-sans tracking-tight">A</span>,
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
        bg: 'bg-zinc-900/90 border border-zinc-800',
        element: <span className="font-bold text-zinc-300 text-xs tracking-tight">{initials || '?'}</span>,
      };
    }
  }
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
        className={`flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} bg-card-bg border border-border-subtle`}
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

  const brand = getBrandDetails('CUSTOM', name);
  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden ${sizeClasses[size]} ${brand.bg}`}
      aria-label={`${name} Logo`}
    >
      {brand.element}
    </div>
  );
};

export default CompanyLogo;
