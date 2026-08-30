'use client';

import React from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminNavbar } from '@/components/AdminNavbar';
import { useSidebarState } from '@/providers/SidebarStateProvider';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useSidebarState();

  const router = useRouter();

  return (
    <div className="flex-1 flex min-h-screen relative z-10 bg-background text-foreground">
      {/* Desktop Admin Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onExitAdmin={() => router.push('/dashboard')}
      />

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Admin Sidebar Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 md:hidden transition-transform duration-300 transform',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebar
          isCollapsed={false}
          setIsCollapsed={() => {}}
          onExitAdmin={() => router.push('/dashboard')}
        />
      </div>

      {/* Main Page Workspace */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
        )}
      >
        {/* Top CMS Header */}
        <AdminNavbar
          onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Central Workspace */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
