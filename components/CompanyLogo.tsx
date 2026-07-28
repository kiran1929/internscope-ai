import React from 'react';

interface CompanyLogoProps {
  logo: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ logo, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs rounded',
    md: 'w-10 h-10 text-sm rounded-lg',
    lg: 'w-14 h-14 text-lg rounded-xl',
  };

  const getBrandDetails = (brand: string) => {
    switch (brand.toUpperCase()) {
      case 'MSFT':
        return {
          bg: 'bg-zinc-900 border border-zinc-800',
          element: (
            <div className="grid grid-cols-2 gap-[2px] w-1/2 h-1/2">
              <span className="bg-[#F25022]"></span>
              <span className="bg-[#7FBA00]"></span>
              <span className="bg-[#00A4EF]"></span>
              <span className="bg-[#FFB900]"></span>
            </div>
          )
        };
      case 'GOOG':
        return {
          bg: 'bg-zinc-950 border border-zinc-800',
          element: (
            <div className="relative flex items-center justify-center w-full h-full">
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#EA4335] border-r-[#4285F4] border-b-[#34A853] border-l-[#FBBC05]"></span>
              <span className="font-bold text-white text-[50%]">G</span>
            </div>
          )
        };
      case 'AAPL':
        return {
          bg: 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-700',
          element: <span className="font-semibold text-black dark:text-white"></span>
        };
      case 'AMZN':
        return {
          bg: 'bg-zinc-900 border border-[#FF9900]/20',
          element: (
            <div className="flex flex-col items-center justify-center font-bold text-white leading-none">
              <span className="text-[60%]">a</span>
              <span className="text-[#FF9900] text-[50%] -mt-1">➔</span>
            </div>
          )
        };
      case 'META':
        return {
          bg: 'bg-gradient-to-r from-[#0064E0] to-[#007DFE] border border-blue-500/20',
          element: <span className="font-extrabold text-white text-[60%] tracking-tighter">∞</span>
        };
      case 'NVDA':
        return {
          bg: 'bg-zinc-900 border border-[#76B900]/30',
          element: <span className="font-bold text-[#76B900] tracking-tighter text-[55%]">NVIDIA</span>
        };
      case 'OPENAI':
        return {
          bg: 'bg-zinc-900 border border-emerald-500/20',
          element: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400 stroke-current" fill="none" strokeWidth="1.5">
              <path d="M12 3v18M3 12h18m-4.5-7.5l-9 9m9 0l-9-9" strokeLinecap="round" />
            </svg>
          )
        };
      case 'ANTH':
        return {
          bg: 'bg-[#E0B89C]/10 border border-[#E0B89C]/35',
          element: <span className="font-serif font-semibold text-[#E0B89C]">A</span>
        };
      case 'STRIPE':
        return {
          bg: 'bg-gradient-to-br from-[#635BFF] to-[#0A2540] border border-indigo-500/20',
          element: <span className="font-black text-white italic text-[70%]">S</span>
        };
      case 'TEAM':
        return {
          bg: 'bg-zinc-900 border border-blue-400/20',
          element: <span className="font-black text-[#0052CC] text-[65%]">A</span>
        };
      case 'DATABRICKS':
        return {
          bg: 'bg-zinc-950 border border-orange-500/20',
          element: <span className="font-bold text-[#FF3621] text-[60%]">▲▼</span>
        };
      case 'SNOW':
        return {
          bg: 'bg-zinc-900 border border-sky-400/20',
          element: <span className="text-sky-400 text-xs">❄</span>
        };
      case 'NET':
        return {
          bg: 'bg-zinc-950 border border-orange-500/20',
          element: <span className="font-bold text-[#F38020] text-[60%]">CF</span>
        };
      case 'NFLX':
        return {
          bg: 'bg-black border border-red-800/30',
          element: <span className="font-black text-[#E50914] text-lg">N</span>
        };
      case 'SPOT':
        return {
          bg: 'bg-[#1ED760]/10 border border-[#1ED760]/30',
          element: <span className="text-[#1ED760] font-bold text-xs">♫</span>
        };
      default:
        // Default avatar initials
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return {
          bg: 'bg-zinc-800 border border-zinc-700',
          element: <span className="font-medium text-zinc-300 text-[80%]">{initials}</span>
        };
    }
  };

  const brand = getBrandDetails(logo);

  return (
    <div
      className={`flex items-center justify-center shrink-0 select-none overflow-hidden ${sizeClasses[size]} ${brand.bg}`}
      aria-label={`${name} Logo`}
    >
      {brand.element}
    </div>
  );
};
export default CompanyLogo;
