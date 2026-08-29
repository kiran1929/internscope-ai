'use client';

import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';

interface AdminNavbarProps {
  onMenuToggle: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onMenuToggle }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, idx) => {
      const href = '/' + paths.slice(0, idx + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      const isLast = idx === paths.length - 1;

      return { href, label, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const notifications = [
    { id: 1, title: 'Scraper Alert', desc: 'Google scraper completed with 12 new openings found.', time: '10m ago', read: false },
    { id: 2, title: 'New User Registration', desc: 'Candidate kiran.candidate@gmail.com signed up.', time: '1h ago', read: false },
    { id: 3, title: 'System Health Check', desc: 'Database connections at 88% pool capacity.', time: '4h ago', read: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="h-16 bg-background border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 md:px-8 relative z-30 ">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-text-muted font-medium" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <span className="text-zinc-600">/</span>}
              {crumb.isLast ? (
                <span className="text-white font-semibold font-display tracking-wide">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Middle Search Input */}
      <div className="flex-1 max-w-sm mx-4 sm:mx-8">
        <div
          className={cn(
            'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border bg-zinc-900/40 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60',
            searchFocused
              ? 'border-primary/60 shadow-[0_0_12px_rgba(37,99,235,0.12)] bg-zinc-900/60'
              : 'border-zinc-800/80 hover:border-zinc-700/60'
          )}
        >
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Global search opportunities, users, logs..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-text-muted/60"
            aria-label="Search CMS"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono text-text-muted bg-zinc-850 border border-zinc-800 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Tools & Avatar */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle (Aesthetic Only, Default Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hidden sm:block"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className={cn(
              'p-2 rounded-lg text-text-muted hover:text-white hover:bg-zinc-900 transition-colors relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
              showNotifications && 'bg-zinc-900 text-white'
            )}
            aria-expanded={showNotifications}
            aria-haspopup="true"
            aria-label="View admin notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-[#09090B]" />
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-80 bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-4 z-20 space-y-3 origin-top-right"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-xs font-semibold text-white">System Admin Alerts</span>
                    <span className="text-[10px] text-primary hover:underline cursor-pointer">Mark read</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'p-2.5 rounded-lg text-left transition-colors border border-transparent hover:border-zinc-850 hover:bg-zinc-900/45 cursor-pointer',
                          !item.read ? 'bg-zinc-900/30' : 'opacity-70'
                        )}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className={cn('text-xs font-medium', !item.read ? 'text-white' : 'text-zinc-300')}>
                            {item.title}
                          </span>
                          <span className="text-[9px] text-text-muted shrink-0 mt-0.5">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Clerk User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
              showProfile && 'bg-zinc-900 text-white'
            )}
            aria-expanded={showProfile}
            aria-haspopup="true"
            aria-label="User Account Options"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-6 h-6 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white">
                AD
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Dropdown */}
          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl p-1 z-20 origin-top-right overflow-hidden"
                >
                  {/* Account Summary Header */}
                  <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.fullName || 'CMS Administrator'}
                    </p>
                    <p className="text-[10px] text-text-muted truncate mt-0.5">
                      {user?.primaryEmailAddress?.emailAddress || 'admin@internscope.ai'}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/10 text-[9px] font-medium uppercase tracking-wider">
                      <ShieldAlert className="w-2.5 h-2.5" /> Admin Panel
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Exit to App Dashboard
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-550/10 hover:bg-red-500/10 transition-colors border-t border-zinc-850 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
