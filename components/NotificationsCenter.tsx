'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  Inbox,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationType } from '@/lib/generated/prisma/enums';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction
} from '@/app/actions/notifications';

interface DBNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsCenterProps {
  notifications: DBNotification[];
}

type TabType = 'ALL' | 'UNREAD' | 'SYSTEM' | 'ALERT' | 'DEADLINE';

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  notifications,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [isPending, startTransition] = useTransition();

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.success) {
        toast.success('Notification marked as read');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.success) {
        toast.success('All notifications marked as read');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteNotificationAction(id);
      if (res.success) {
        toast.success('Notification deleted');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  // Filter notifications based on tab selection
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'SYSTEM') return n.type === 'SYSTEM';
    if (activeTab === 'ALERT') return n.type === 'ALERT';
    if (activeTab === 'DEADLINE') return n.type === 'APPLICATION_DEADLINE';
    return true; // 'ALL'
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 text-white relative">
      {isPending && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-30 rounded-xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Tabs and Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111113] border border-zinc-800/80 p-3 rounded-xl">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'UNREAD', 'SYSTEM', 'ALERT', 'DEADLINE'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
                activeTab === tab
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-transparent border-transparent text-text-muted hover:text-white'
              )}
            >
              {tab === 'DEADLINE' ? 'Deadlines' : tab.toLowerCase()}
              {tab === 'UNREAD' && unreadCount > 0 && (
                <span className="ml-1.5 bg-primary text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer px-3 py-1.5 border border-zinc-800 bg-zinc-900/40 rounded-lg hover:border-zinc-700"
          >
            <CheckCheck className="w-4 h-4 text-primary" /> Mark all read
          </button>
        )}
      </div>

      {/* Notification items */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            // Pick corresponding icon
            let Icon: React.ComponentType<{ className?: string }> = Info;
            let iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';

            if (n.type === 'SYSTEM') {
              Icon = ServerIcon;
              iconColor = 'text-primary bg-primary/10 border-primary/20';
            } else if (n.type === 'ALERT') {
              Icon = AlertTriangle;
              iconColor = 'text-red-400 bg-red-500/10 border-red-500/20';
            } else if (n.type === 'APPLICATION_DEADLINE') {
              Icon = Calendar;
              iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            } else if (n.type === 'MATCH_ACCURACY') {
              Icon = Sparkles;
              iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            }

            return (
              <div
                key={n.id}
                className={cn(
                  'p-4 bg-[#111113] border rounded-xl flex items-start justify-between gap-4 transition-all hover:border-zinc-700/60',
                  n.isRead ? 'border-zinc-800/80 opacity-70' : 'border-zinc-850 bg-zinc-900/5'
                )}
              >
                <div className="flex gap-3 min-w-0">
                  <div className={cn('p-2 rounded-lg border shrink-0', iconColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white leading-none">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed pr-6">{n.message}</p>
                    <span className="text-[9px] text-text-muted font-mono block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 rounded hover:bg-zinc-850 text-text-muted hover:text-white transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded hover:bg-zinc-850 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-zinc-850 bg-[#111113]/30 rounded-xl p-8 text-center ">
            <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-text-muted mb-4">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Inbox Zero</h3>
            <p className="text-[10px] text-text-muted max-w-xs leading-relaxed">
              No notifications matched the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const ServerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="8" x="2" y="2" rx="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}
