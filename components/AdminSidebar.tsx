'use client';

import React from 'react';
import {
  LayoutDashboard,
  Building,
  Compass,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  FileText,
  Cpu,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminTab =
  | 'overview'
  | 'opportunities'
  | 'companies'
  | 'users'
  | 'applications'
  | 'resumes'
  | 'settings'
  | 'system'
  | 'feedback'
  | 'invitations';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onExitAdmin: () => void;
}

interface SidebarItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  onExitAdmin,
}) => {
  const pathname = usePathname();

  const getActiveTab = (): AdminTab => {
    if (pathname === '/admin') return 'overview';
    if (pathname.startsWith('/admin/opportunities')) return 'opportunities';
    if (pathname.startsWith('/admin/companies')) return 'companies';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/applications')) return 'applications';
    if (pathname.startsWith('/admin/resumes')) return 'resumes';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    if (pathname.startsWith('/admin/system')) return 'system';
    if (pathname.startsWith('/admin/feedback')) return 'feedback';
    if (pathname.startsWith('/admin/invitations')) return 'invitations';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'opportunities', label: 'Manage Jobs', icon: Compass, href: '/admin/opportunities' },
    { id: 'companies', label: 'Manage Companies', icon: Building, href: '/admin/companies' },
    { id: 'users', label: 'Manage Users', icon: Users, href: '/admin/users' },
    { id: 'applications', label: 'User Applications', icon: Briefcase, href: '/admin/applications' },
    { id: 'resumes', label: 'Resume Analytics', icon: FileText, href: '/admin/resumes' },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, href: '/admin/settings' },
    { id: 'system', label: 'System Health', icon: Cpu, href: '/admin/system' },
    { id: 'feedback', label: 'Feedback Moderation', icon: MessageSquare, href: '/admin/feedback' },
    { id: 'invitations', label: 'Beta Invites', icon: Mail, href: '/admin/invitations' },
  ];

  return (
    <aside
      style={{ width: isCollapsed ? 72 : 260 }}
      className="fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-sidebar border-r border-border-subtle transition-[width] duration-300 ease-out"
    >
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

      <div className="h-16 flex items-center shrink-0 border-b border-border-subtle px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/25">
            <Compass className="w-[18px] h-[18px]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="font-display font-bold text-[15px] tracking-tight text-foreground leading-none">
                AdminScope<span className="text-primary">CMS</span>
              </p>
              <p className="text-[10px] text-text-muted mt-1 font-medium">Control panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-3 space-y-0.5', isCollapsed ? 'px-2' : 'px-3')}>
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted/70">
            Admin
          </p>
        )}
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
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
              {isCollapsed && <span className="sidebar-tooltip">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn('shrink-0 border-t border-border-subtle', isCollapsed ? 'p-2' : 'p-3')}>
        <button
          type="button"
          onClick={onExitAdmin}
          className={cn(
            'sidebar-nav-link text-red-400 hover:text-red-500 hover:bg-red-500/10 w-full',
            isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
          )}
          title="Exit to Dashboard"
        >
          <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span className="text-[13px] font-medium">Exit CMS</span>}
          {isCollapsed && <span className="sidebar-tooltip">Exit CMS</span>}
        </button>
      </div>
    </aside>
  );
};
