import { prisma } from '../db';
import { RedisCache } from './redis';

export interface HealthStatus {
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

export class HealthMonitor {
  private static startTime = Date.now();

  static async checkHealth(): Promise<HealthStatus> {
    const services = {
      database: { status: 'UP' as 'UP' | 'DOWN', latencyMs: 0 },
      redis: { status: 'UP' as 'UP' | 'DOWN', latencyMs: 0 },
      aiProviders: { status: 'UP' as 'UP' | 'DOWN' },
      triggerDev: { status: 'UP' as 'UP' | 'DOWN' },
    };

    // 1. Check Database connection & latency
    const dbStart = Date.now();
    try {
      await prisma.$executeRaw`SELECT 1`;
      services.database.latencyMs = Date.now() - dbStart;
    } catch (e) {
      console.error('HealthCheck: DB failure:', e);
      services.database.status = 'DOWN';
    }

    // 2. Check Redis speed & latency
    const redisStart = Date.now();
    try {
      await RedisCache.set('healthcheck:ping', 'pong', 5);
      const res = await RedisCache.get<string>('healthcheck:ping');
      if (res !== 'pong') throw new Error('Redis ping mismatch');
      services.redis.latencyMs = Date.now() - redisStart;
    } catch (e) {
      console.warn('HealthCheck: Redis failure:', e);
      services.redis.status = 'DOWN';
    }

    // 2.5 Check AI provider and Trigger.dev connectivity
    if (!process.env.GEMINI_API_KEY) {
      services.aiProviders.status = 'DOWN';
    }
    if (!process.env.TRIGGER_API_KEY) {
      services.triggerDev.status = 'DOWN';
    }

    // 3. Query system audit failure logs
    const recentFailures = await prisma.systemAuditLog.findMany({
      where: { status: 'FAILURE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        status: true,
        details: true,
        createdAt: true,
      },
    });

    // 4. Evaluate combined system status
    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    if (services.database.status === 'DOWN') {
      status = 'UNHEALTHY';
    } else if (services.redis.status === 'DOWN' || recentFailures.length > 2) {
      status = 'DEGRADED';
    }

    return {
      status,
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
      services,
      recentFailures,
    };
  }
}
