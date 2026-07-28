'use client';

import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

interface NavbarProps {
  onMenuToggle: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, title }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDark, setIsDark] = useState(true); // Default dark theme

  const notifications = [
    { id: 1, title: 'Interview Scheduled', desc: 'Stripe payments role panel scheduled for Aug 4.', time: '2h ago', read: false },
    { id: 2, title: 'Deadline Approaching', desc: 'NVIDIA applications close in 2 days.', time: '1d ago', read: false },
    { id: 3, title: 'Match Score Updated', desc: 'Your match score for Apple SWE increased by 8%.', time: '3d ago', read: true },
  ];

  return (
    <header className="h-16 bg-[#09090B] border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 md:px-8 relative z-30 select-none">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View Title */}
        <h1 className="text-sm font-bold font-display text-white tracking-tight uppercase hidden sm:block">
          {title.replace('-', ' ')}
        </h1>
      </div>

      {/* Middle Search Input */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
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
            placeholder="Search internships, companies, roles..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-text-muted/60"
            aria-label="Search dashboard"
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
          onClick={() => setIsDark(!isDark)}
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
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-[#09090B]"></span>
          </button>

          {/* Notifications Panel */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50 origin-top-right"
                role="menu"
              >
                <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <button className="text-[10px] text-primary hover:underline font-semibold focus-visible:outline-none">Mark all read</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800/40">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3.5 hover:bg-zinc-950 transition-colors cursor-pointer group" role="menuitem">
                      <div className="flex items-start gap-2.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary', notif.read && 'bg-transparent')} />
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-white group-hover:text-primary transition-colors">{notif.title}</p>
                          <p className="text-[11px] text-text-muted leading-relaxed">{notif.desc}</p>
                          <p className="text-[9px] text-text-muted/50 font-mono mt-0.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-800 text-center">
                  <button className="text-xs text-text-muted hover:text-white font-medium w-full py-1 focus-visible:outline-none">View all activity</button>
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
              'flex items-center gap-1.5 p-1 rounded-lg hover:bg-zinc-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
              showProfile && 'bg-zinc-900'
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
                className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-850"
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
                className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50 origin-top-right"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Anonymous Candidate'}</p>
                  <p className="text-[10px] text-text-muted truncate font-mono">{user?.primaryEmailAddress?.emailAddress || 'Not authenticated'}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-white hover:bg-zinc-950 transition-colors focus-visible:outline-none"
                    role="menuitem"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      router.push('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-text-muted hover:text-white hover:bg-zinc-950 transition-colors focus-visible:outline-none"
                    role="menuitem"
                  >
                    Platform Settings
                  </button>
                </div>
                <div className="border-t border-zinc-800 py-1">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      signOut({ redirectUrl: '/' });
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-zinc-950 transition-colors focus-visible:outline-none"
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
    </header>
  );
};
export default Navbar;
