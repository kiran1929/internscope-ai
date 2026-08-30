'use client';

import React from 'react';
import { Sidebar, DashboardTab } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { SidebarStateProvider, useSidebarState } from '@/providers/SidebarStateProvider';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useSidebarState();

  const pathname = usePathname();
  const router = useRouter();

  const getActiveTabFromPath = (path: string): DashboardTab => {
    if (path.startsWith('/resume')) return 'resume';
    if (path.startsWith('/cover-letter')) return 'cover-letter';
    if (path.startsWith('/copilot')) return 'copilot';
    if (path.startsWith('/interview')) return 'interview';
    if (path.startsWith('/internships') || path.startsWith('/jobs')) return 'internships';
    if (path.startsWith('/companies')) return 'companies';
    if (path.startsWith('/saved')) return 'saved';
    if (path.startsWith('/applications')) return 'applications';
    if (path.startsWith('/email-reports')) return 'email-reports';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/profile')) return 'settings';
    if (path.startsWith('/career')) return 'overview';
    return 'overview';
  };

  const activeTab = getActiveTabFromPath(pathname);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex-1 flex min-h-screen relative z-10">
      <Sidebar
        activeTab={activeTab}
        onNavigate={closeMobileSidebar}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onExitDemo={() => router.push('/')}
      />

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-xs z-35 md:hidden animate-in fade-in duration-200"
          onClick={closeMobileSidebar}
        />
      )}

      <div
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 md:hidden transition-transform duration-300 transform',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          activeTab={activeTab}
          onNavigate={closeMobileSidebar}
          isCollapsed={false}
          setIsCollapsed={() => {}}
          onExitDemo={() => router.push('/')}
        />
      </div>

      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-out',
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
        )}
      >
        <Navbar
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          title={activeTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarStateProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarStateProvider>
  );
}
