'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building,
  Compass,
  Bookmark,
  Briefcase,
  Mail,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Award,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardTab =
  | 'overview'
  | 'companies'
  | 'internships'
  | 'saved'
  | 'applications'
  | 'resume'
  | 'resume-optimize'
  | 'cover-letter'
  | 'interview'
  | 'copilot'
  | 'email-reports'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onExitDemo: () => void;
}

interface SidebarItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  onExitDemo,
}) => {
  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building },
    { id: 'internships', label: 'Internships', icon: Compass },
    { id: 'saved', label: 'Saved Positions', icon: Bookmark },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'resume', label: 'Resume Intel', icon: FileText },
    { id: 'resume-optimize', label: 'ATS Optimizer', icon: Sparkles },
    { id: 'cover-letter', label: 'Cover Letters', icon: Mail },
    { id: 'interview', label: 'Interview Prep', icon: Award },
    { id: 'copilot', label: 'AI Copilot', icon: Brain },
    { id: 'email-reports', label: 'Email Reports', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#111113] border-r border-zinc-800/80 transition-all duration-300',
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-900">
        <div className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "justify-center w-full")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 shadow-md shadow-primary/20">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-base tracking-tight text-white animate-fade-in whitespace-nowrap">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md text-text-muted hover:text-white hover:bg-zinc-800 transition-colors hidden md:block"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 select-none overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative border border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:border-transparent',
                isActive
                  ? 'bg-zinc-900/80 border-zinc-800 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                  : 'text-text-muted hover:text-white hover:bg-zinc-900/40'
              )}
            >
              {isActive && (
                <span className="absolute left-1 w-[3px] h-4 bg-primary rounded-full" />
              )}
              <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-105', isActive ? 'text-primary' : 'text-text-muted group-hover:text-white')} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <span className="absolute left-[80px] bg-zinc-950 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 border border-zinc-800 shadow-xl pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Pro Badge / Back to Demo Button */}
      <div className="p-4 border-t border-zinc-900">
        {!isCollapsed ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-white">Free Account</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Track unlimited companies & unlock AI tailoring tools.
            </p>
            <button
              onClick={onExitDemo}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors duration-200"
            >
              Back to Landing
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onExitDemo}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-text-muted hover:text-white transition-colors"
              title="Back to Landing Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
