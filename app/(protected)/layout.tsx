'use client';

import React from 'react';
import { Sidebar, DashboardTab } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { DashboardStateProvider, useDashboardState } from '@/providers/DashboardStateProvider';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useDashboardState();

  const router = useRouter();
  const pathname = usePathname();

  // Map the current path to the DashboardTab type
  const getActiveTabFromPath = (path: string): DashboardTab => {
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // Default to 'overview' for /dashboard or fallback
    if (!lastSegment || lastSegment === 'dashboard') return 'overview';
    return lastSegment as DashboardTab;
  };

  const activeTab = getActiveTabFromPath(pathname);

  const handleTabChange = (tab: DashboardTab) => {
    setMobileSidebarOpen(false);
    if (tab === 'overview') {
      router.push('/dashboard');
    } else {
      router.push(`/${tab}`);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen relative z-10">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onExitDemo={() => router.push('/')}
      />

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slider */}
      <div
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 md:hidden transition-transform duration-300 transform',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isCollapsed={false}
          setIsCollapsed={() => {}}
          onExitDemo={() => router.push('/')}
        />
      </div>

      {/* Main Page Workspace */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'
        )}
      >
        {/* Top Navigation */}
        <Navbar
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          title={activeTab}
        />

        {/* Central Workspace */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#09090B] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardStateProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </DashboardStateProvider>
  );
}
