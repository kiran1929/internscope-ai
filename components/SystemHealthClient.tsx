'use client';

import React, { useState, useTransition } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Database,
  Layers,
  Activity,
  UserCheck,
  TrendingUp,
  Cpu,
  CornerDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleFeatureFlagAction, updateFlagRolloutAction, refreshSystemHealthAction } from '@/app/actions/system';

interface HealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  uptimeSeconds: number;
  services: {
    database: { status: 'UP' | 'DOWN'; latencyMs: number };
    redis: { status: 'UP' | 'DOWN'; latencyMs: number };
    aiProviders: { status: 'UP' | 'DOWN' };
    triggerDev: { status: 'UP' | 'DOWN' };
  };
  recentFailures: Array<{
    id: string;
    action: string;
    status: string;
    details: string;
    createdAt: Date;
  }>;
}

interface FlagItem {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercent: number;
  allowedRoles: string[];
}

interface SystemHealthClientProps {
  initialHealth: HealthStatus;
  initialFlags: FlagItem[];
}

export default function SystemHealthClient({
  initialHealth,
  initialFlags,
}: SystemHealthClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [health, setHealth] = useState<HealthStatus>(initialHealth);
  const [flags, setFlags] = useState<FlagItem[]>(initialFlags);

  const handleRefreshHealth = () => {
    startTransition(async () => {
      const res = await refreshSystemHealthAction();
      if (res.success && res.health) {
        setHealth(res.health as HealthStatus);
        toast.success('System parameters refreshed!');
      } else {
        toast.error('Failed to query health diagnostics.');
      }
    });
  };

  const handleToggleFlag = (flagName: string, active: boolean) => {
    startTransition(async () => {
      const res = await toggleFeatureFlagAction(flagName, active);
      if (res.success && res.flag) {
        setFlags(prev => prev.map(f => f.name === flagName ? { ...f, isEnabled: res.flag.isEnabled } : f));
        toast.success(`Flag ${flagName} updated successfully.`);
      } else {
        toast.error(`Update failed: ${res.error}`);
      }
    });
  };

  const handleRolloutChange = (flagName: string, val: number) => {
    startTransition(async () => {
      const res = await updateFlagRolloutAction(flagName, val);
      if (res.success && res.flag) {
        setFlags(prev => prev.map(f => f.name === flagName ? { ...f, rolloutPercent: res.flag.rolloutPercent } : f));
        toast.success(`Rollout percentage set to ${val}%`);
      } else {
        toast.error(`Canary setup failed: ${res.error}`);
      }
    });
  };

  // Status mapping UI helper
  const getStatusIcon = (status: string) => {
    if (status === 'HEALTHY' || status === 'UP') {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'DEGRADED') {
      return <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />;
    }
    return <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" /> Platform System Health Check
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Real-time status indicators, database transaction latency metrics, and feature canary configurations.</p>
        </div>

        <button
          onClick={handleRefreshHealth}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          <span>Refresh Health Checks</span>
        </button>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Status widget */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Combined System Status</span>
          <div className="my-3 flex flex-col items-center gap-2">
            {getStatusIcon(health.status)}
            <span className="text-lg font-black tracking-tight uppercase">{health.status}</span>
          </div>
          <span className="text-[9px] font-mono text-zinc-555">Uptime: {health.uptimeSeconds} seconds</span>
        </div>

        {/* Database performance widget */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> Neon PostgreSQL Latency
          </span>
          <div className="py-2.5">
            <span className="text-2xl font-black font-mono">{health.services.database.latencyMs}ms</span>
          </div>
          <div className="flex justify-between items-center text-[9px] border-t border-zinc-900 pt-2 text-zinc-500 font-mono">
            <span>Status:</span>
            <span className={health.services.database.status === 'UP' ? 'text-emerald-400' : 'text-red-400'}>
              {health.services.database.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Redis performance widget */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-primary" /> Redis Cache Latency
          </span>
          <div className="py-2.5">
            <span className="text-2xl font-black font-mono">
              {health.services.redis.status === 'UP' ? `${health.services.redis.latencyMs}ms` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px] border-t border-zinc-900 pt-2 text-zinc-500 font-mono">
            <span>Status:</span>
            <span className={health.services.redis.status === 'UP' ? 'text-emerald-400' : 'text-zinc-650'}>
              {health.services.redis.status === 'UP' ? 'ONLINE' : 'OFFLINE / LOCAL FALLBACK'}
            </span>
          </div>
        </div>

      </div>

      {/* Flag splits and Failure logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left: Feature Flags management panel */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Canary Feature Flags
          </h3>
          
          <div className="space-y-4 pt-2">
            {flags.length === 0 ? (
              <p className="text-[10px] text-zinc-550 py-4 text-center">No feature flags registered in database schema.</p>
            ) : (
              flags.map(f => (
                <div key={f.id} className="border border-zinc-900 bg-zinc-950/30 rounded-lg p-3 space-y-3.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-zinc-200">{f.name}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{f.description || 'No description provided'}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(f.name, !f.isEnabled)}
                      className={`px-3 py-1 rounded text-[10px] font-bold ${
                        f.isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-450 border border-zinc-850'
                      }`}
                    >
                      {f.isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[9px] border-t border-zinc-900 pt-3">
                    <div className="flex justify-between items-center text-zinc-400 font-mono">
                      <span>Canary Rollout:</span>
                      <span>{f.rolloutPercent}% rollout</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={f.rolloutPercent}
                      onChange={(e) => handleRolloutChange(f.name, Number(e.target.value))}
                      className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Sentry Failure logs */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-red-400" /> Sentry Error Event Stream
          </h3>

          <div className="space-y-3 pt-2">
            {health.recentFailures.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-lg text-[10px] text-zinc-550">
                <span>0 active failure exceptions registered. Platform running healthy.</span>
              </div>
            ) : (
              health.recentFailures.map(fail => (
                <div key={fail.id} className="border border-red-950/20 bg-red-950/5 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[9px] text-red-400 font-mono">
                    <span className="font-bold uppercase">{fail.action}</span>
                    <span>{new Date(fail.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-normal">{fail.details.slice(0, 180)}...</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
