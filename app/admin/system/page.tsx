import React from 'react';
import { prisma } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/generated/prisma/enums';
import {
  Database,
  Cpu,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    redirect('/403');
  }
  return dbUser;
}

export default async function AdminSystemPage() {
  await getAdminUser();

  // Test Neon PostgreSQL connection health
  let dbStatus = 'Unhealthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Healthy';
  } catch (err) {
    console.error('System page DB query test failure:', err);
    dbStatus = 'Connection Error';
  }

  // System environment properties
  const nodeVersion = process.version;
  const envMode = process.env.NODE_ENV || 'development';

  // Mock background jobs
  const backgroundJobs = [
    { name: 'Opportunities Syncer Cron', interval: 'Every 12 Hours', lastRun: '2 hours ago', status: 'Healthy', active: true },
    { name: 'Weekly Digest Newsletter Mailer', interval: 'Every Sunday 09:00 UTC', lastRun: '3 days ago', status: 'Healthy', active: true },
    { name: 'User Engagement Analytics Aggregator', interval: 'Every 24 Hours', lastRun: '10 hours ago', status: 'Healthy', active: true },
    { name: 'Stale Draft Cleaning Job', interval: 'Every Sunday 00:00 UTC', lastRun: '3 days ago', status: 'Standby', active: false },
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          Platform System Management
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Monitor system variables, execution nodes, Neon database states, and background cron schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Server Status & Database Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Environment Variables & Server Info */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" /> Application Runtime Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-text-muted">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Framework</span>
                  <span className="text-white font-semibold">Next.js 16.2.x (App Router)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Node.js version</span>
                  <span className="text-white font-mono">{nodeVersion}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Environment Mode</span>
                  <span className="text-white font-semibold uppercase">{envMode}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Active Sync Agent</span>
                  <span className="text-white font-semibold">Idle</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Platform Version</span>
                  <span className="text-white font-mono">v0.3.0</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Vercel Region</span>
                  <span className="text-white font-semibold">iad1 (us-east)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Specs */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary" /> Database Infrastructure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-text-muted">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Database Engine</span>
                  <span className="text-white font-semibold">Neon Serverless PostgreSQL</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Connection Pooling</span>
                  <span className="text-emerald-400 font-bold uppercase">Active</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>SSL Mode</span>
                  <span className="text-white font-mono">require</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Prisma ORM</span>
                  <span className="text-white font-mono font-semibold">7.9.1</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>SSL State</span>
                  <span className="text-primary font-bold font-mono">Verify Full</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2.5">
                  <span>Connection Status</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    dbStatus === 'Healthy' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {dbStatus === 'Healthy' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {dbStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Build info & Background tasks placeholders */}
        <div className="space-y-6">
          {/* Build Info */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-3 text-xs text-text-muted">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" /> Build & Release
            </h3>
            
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span>App version</span>
              <span className="text-white font-mono">v0.3.0-rc1</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span>Last Build Commit</span>
              <span className="text-white font-mono">5d1a98c (main)</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2.5">
              <span>Build Environment</span>
              <span className="text-white">Vercel Build Server</span>
            </div>
            <div className="flex justify-between">
              <span>Release Stage</span>
              <span className="text-primary font-bold uppercase">Pre-Production</span>
            </div>
          </div>

          {/* Background Cron list */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Background Cron Jobs
            </h3>

            <div className="space-y-3">
              {backgroundJobs.map((job) => (
                <div
                  key={job.name}
                  className="p-3 bg-zinc-950/40 border border-zinc-900/60 rounded-lg space-y-1.5 hover:border-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {job.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                      job.active
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500'
                    }`}>
                      {job.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">Interval: {job.interval}</p>
                  <p className="text-[10px] text-text-muted">Last execute: {job.lastRun}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
