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
  ArrowLeft
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
  | 'settings';

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

  // Determine active tab based on path
  const getActiveTab = (): AdminTab => {
    if (pathname === '/admin') return 'overview';
    if (pathname.startsWith('/admin/opportunities')) return 'opportunities';
    if (pathname.startsWith('/admin/companies')) return 'companies';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/applications')) return 'applications';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'opportunities', label: 'Manage Jobs', icon: Compass, href: '/admin/opportunities' },
    { id: 'companies', label: 'Manage Companies', icon: Building, href: '/admin/companies' },
    { id: 'users', label: 'Manage Users', icon: Users, href: '/admin/users' },
    { id: 'applications', label: 'User Applications', icon: Briefcase, href: '/admin/applications' },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, href: '/admin/settings' },
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
              AdminScope<span className="text-primary font-black">CMS</span>
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
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-zinc-900 border border-zinc-800 text-white shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-zinc-900/50 border border-transparent'
              )}
            >
              {/* Left glow accent for active item */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-text-muted group-hover:text-white')} />
              {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Exit Button */}
      <div className="p-3 border-t border-zinc-900">
        <button
          onClick={onExitAdmin}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
            isCollapsed && 'justify-center px-0'
          )}
          title="Exit to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Exit CMS</span>}
        </button>
      </div>
    </aside>
  );
};
