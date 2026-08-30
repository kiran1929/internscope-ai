'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Brain,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutModal } from '@/components/SignOutModal';

export type DashboardTab =
  | 'overview'
  | 'companies'
  | 'internships'
  | 'saved'
  | 'applications'
  | 'resume'
  | 'cover-letter'
  | 'interview'
  | 'copilot'
  | 'email-reports'
  | 'analytics'
  | 'settings';

export const TAB_HREF: Record<DashboardTab, string> = {
  overview: '/dashboard',
  companies: '/companies',
  internships: '/internships',
  saved: '/saved',
  applications: '/applications',
  resume: '/resume',
  'cover-letter': '/cover-letter',
  interview: '/interview',
  copilot: '/copilot',
  'email-reports': '/email-reports',
  analytics: '/analytics',
  settings: '/settings',
};

interface SidebarProps {
  activeTab: DashboardTab;
  onNavigate?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface SidebarItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 72;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleOpenSignOutModal = () => {
    if (onNavigate) {
      onNavigate();
    }
    setShowSignOutModal(true);
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building },
    { id: 'internships', label: 'Internships', icon: Compass },
    { id: 'saved', label: 'Saved Positions', icon: Bookmark },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'resume', label: 'Resume Intel', icon: FileText },
    { id: 'cover-letter', label: 'Cover Letters', icon: Mail },
    { id: 'interview', label: 'Interview Prep', icon: Award },
    { id: 'copilot', label: 'AI Copilot', icon: Brain },
    { id: 'email-reports', label: 'Email Reports', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      style={{ width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
      className="fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-sidebar border-r border-border-subtle transition-[width] duration-300 ease-out"
    >
      {/* Floating edge toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="sidebar-edge-toggle hidden md:flex"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand */}
      <div className="h-16 flex items-center shrink-0 border-b border-border-subtle px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/25">
            <Compass className="w-[18px] h-[18px]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="font-display font-bold text-[15px] tracking-tight text-foreground leading-none">
                InternScope<span className="text-primary">AI</span>
              </p>
              <p className="text-[10px] text-text-muted mt-1 font-medium">Career workspace</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto py-3 space-y-0.5', isCollapsed ? 'px-2' : 'px-3')}>
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted/70">
            Menu
          </p>
        )}
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={TAB_HREF[item.id]}
              prefetch
              onClick={onNavigate}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'sidebar-nav-link group relative',
                isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                isActive && 'sidebar-nav-link-active'
              )}
            >
              <Icon
                className={cn(
                  'w-[18px] h-[18px] shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted group-hover:text-foreground'
                )}
              />
              {!isCollapsed && (
                <span className="truncate text-[13px] font-medium">{item.label}</span>
              )}
              {isCollapsed && (
                <span className="sidebar-tooltip">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('shrink-0 border-t border-border-subtle', isCollapsed ? 'p-2' : 'p-3')}>
        {!isCollapsed ? (
          <div className="rounded-xl border border-border-subtle bg-surface-muted/50 p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-none">Free Account</p>
                <p className="text-[10px] text-text-muted mt-0.5">All core tools unlocked</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenSignOutModal}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border-subtle bg-card-bg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenSignOutModal}
            className="sidebar-nav-link justify-center px-0 py-2.5 w-full hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-[18px] h-[18px] text-text-muted hover:text-red-500" />
            <span className="sidebar-tooltip">Sign Out</span>
          </button>
        )}
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </aside>
  );
};

export { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED };
export default Sidebar;
