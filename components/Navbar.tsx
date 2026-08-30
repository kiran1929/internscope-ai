'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getMyNotificationsAction } from '@/app/actions/notifications';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';

import { SignOutModal } from '@/components/SignOutModal';

interface NavbarProps {
  onMenuToggle: () => void;
  title: string;
}

const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Overview',
  internships: 'Internships',
  jobs: 'Internships',
  companies: 'Companies',
  saved: 'Saved Positions',
  applications: 'Applications',
  resume: 'Resume Intel',
  optimize: 'ATS Optimizer',
  'cover-letter': 'Cover Letters',
  interview: 'Interview Prep',
  history: 'History Logs',
  copilot: 'AI Copilot',
  'email-reports': 'Email Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  profile: 'Profile',
  career: 'Career Intel',
};

const TITLE_MAP: Record<string, string> = {
  overview: 'Candidate Overview',
  companies: 'Companies Explorer',
  internships: 'Find Opportunities',
  saved: 'Saved Positions',
  applications: 'Applications Tracker',
  resume: 'Resume Intelligence',
  'cover-letter': 'Cover Letter Studio',
  interview: 'Interview Preparation',
  copilot: 'AI Application Copilot',
  'email-reports': 'Email Intelligence Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  profile: 'Profile',
  career: 'Career Intelligence',
};

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, title }) => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<any[]>([]);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function loadNotifications() {
      const res = await getMyNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!showNotifications && !showProfile) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showNotifications, showProfile]);

  // Parse path segments into human-friendly breadcrumbs
  const getBreadcrumbs = () => {
    const rawSegments = (pathname || '').split('/').filter(Boolean);
    if (rawSegments.length === 0) {
      return [{ label: 'Dashboard', href: '/dashboard', isLast: true }];
    }

    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || str.length > 20;

    const crumbs: { label: string; href: string; isLast: boolean }[] = [];

    // Special cases
    if (rawSegments[0] === 'jobs') {
      crumbs.push({ label: 'Internships', href: '/internships', isLast: false });
      crumbs.push({ label: 'Job Details', href: pathname, isLast: true });
      return crumbs;
    }

    if (rawSegments[0] === 'interview' && rawSegments.length > 1) {
      crumbs.push({ label: 'Interview Prep', href: '/interview', isLast: false });
      if (rawSegments[1] === 'history') {
        crumbs.push({ label: 'Practice Logs', href: '/interview/history', isLast: true });
      } else {
        crumbs.push({ label: 'Mock Session', href: pathname, isLast: true });
      }
      return crumbs;
    }

    if (rawSegments[0] === 'cover-letter' && rawSegments.length > 1) {
      crumbs.push({ label: 'Cover Letters', href: '/cover-letter', isLast: false });
      crumbs.push({ label: 'Studio Generator', href: pathname, isLast: true });
      return crumbs;
    }

    if (rawSegments[0] === 'copilot' && rawSegments.length > 1 && rawSegments[1] === 'history') {
      crumbs.push({ label: 'AI Copilot', href: '/copilot', isLast: false });
      crumbs.push({ label: 'Weekly Reports', href: '/copilot/history', isLast: true });
      return crumbs;
    }

    rawSegments.forEach((segment, idx) => {
      const href = '/' + rawSegments.slice(0, idx + 1).join('/');
      let label = routeNameMap[segment.toLowerCase()];
      if (!label) {
        if (isUUID(segment)) {
          label = 'Details';
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }
      }
      const isLast = idx === rawSegments.length - 1;
      crumbs.push({ label, href, isLast });
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isSubPage = breadcrumbs.length > 1;

  // Derive parent path for back button
  const getParentPath = () => {
    if (breadcrumbs.length > 1) {
      return breadcrumbs[breadcrumbs.length - 2].href;
    }
    return '/dashboard';
  };

  return (
    <header ref={navRef} className="app-navbar">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Button for nested / sub-pages */}
        {isSubPage && (
          <button
            onClick={() => router.push(getParentPath())}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-muted hover:bg-border-subtle hover:border-border-hover text-text-muted hover:text-foreground transition-all text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary"
            title="Go back"
            aria-label="Go back to parent page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Current Location Breadcrumb Bar */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted font-medium min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href + idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              {crumb.isLast ? (
                <span className="text-foreground font-semibold font-display tracking-tight text-xs sm:text-sm">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none text-text-muted"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Search — desktop only */}
      <div className="hidden lg:flex flex-1 max-w-md mx-6">
        <div
          className={cn(
            'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border bg-surface-muted transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60',
            searchFocused
              ? 'border-primary/60 shadow-[0_0_12px_rgba(37,99,235,0.12)] bg-input-bg'
              : 'border-border-subtle hover:border-border-hover'
          )}
        >
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search internships, companies, roles..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-text-muted/60"
            aria-label="Search dashboard"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono text-text-muted bg-surface-muted border border-border-subtle px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Tools & Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          href="/internships"
          className="lg:hidden p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          aria-label="Search internships"
        >
          <Search className="w-4 h-4" />
        </Link>
        {/* Theme Toggle (Aesthetic Only, Default Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hidden sm:block"
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
              'p-2 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
              showNotifications && 'bg-surface-muted text-foreground'
            )}
            aria-expanded={showNotifications}
            aria-haspopup="true"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background"></span>
          </button>

          {/* Notifications Panel */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-80 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-1 z-50 origin-top-right"
                role="menu"
              >
                <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  <button className="text-[10px] text-primary hover:underline font-semibold focus-visible:outline-none">Mark all read</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-border-subtle">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-zinc-550 py-6 text-center">No notifications logged.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3.5 hover:bg-surface-muted transition-colors cursor-pointer group" role="menuitem">
                        <div className="flex items-start gap-2.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary', notif.isRead && 'bg-transparent')} />
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{notif.title}</p>
                            <p className="text-[11px] text-text-muted leading-relaxed">{notif.message}</p>
                            <p className="text-[9px] text-text-muted/50 font-mono mt-0.5">{new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-border-subtle text-center">
                  <button className="text-xs text-text-muted hover:text-foreground font-medium w-full py-1 focus-visible:outline-none">View all activity</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className={cn(
              'flex items-center gap-1.5 p-1 rounded-lg hover:bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
              showProfile && 'bg-surface-muted'
            )}
            aria-expanded={showProfile}
            aria-haspopup="true"
            aria-label="User Account Menu"
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={user.fullName || 'User Avatar'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-border-subtle"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-white text-xs ring-1 ring-zinc-800">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-text-muted hidden sm:block" />
          </button>

          {/* Profile Dropdown Panel */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-56 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden py-1 z-50 origin-top-right"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-border-subtle">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || 'Anonymous Candidate'}</p>
                  <p className="text-[10px] text-text-muted truncate font-mono">{user?.primaryEmailAddress?.emailAddress || 'Not authenticated'}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors focus-visible:outline-none"
                    role="menuitem"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors focus-visible:outline-none"
                    role="menuitem"
                  >
                    Platform Settings
                  </button>
                  {user?.primaryEmailAddress?.emailAddress && 
                   ['gudepukirandeep@gmail.com', 'admin@internscope.ai'].includes(user.primaryEmailAddress.emailAddress.toLowerCase()) && (
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        router.push('/admin');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none flex items-center justify-between"
                      role="menuitem"
                    >
                      <span>Admin Console</span>
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">CMS</span>
                    </button>
                  )}
                </div>
                <div className="border-t border-border-subtle py-1">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      setShowSignOutModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-surface-muted transition-colors focus-visible:outline-none cursor-pointer"
                    role="menuitem"
                  >
                    Log out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
    </header>
  );
};
export default Navbar;
