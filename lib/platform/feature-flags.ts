import { prisma } from '../db';
import { RedisCache } from './redis';

export class FeatureFlagManager {
  private static CACHE_TTL_SECONDS = 300; // 5-minute cache

  static async isEnabled(
    flagName: string,
    context?: { userId?: string; userRole?: string }
  ): Promise<boolean> {
    const cacheKey = `featureflag:${flagName}`;
    
    // 1. Try to read from cache first
    let flag = await RedisCache.get<any>(cacheKey);

    if (!flag) {
      // Query Database
      flag = await prisma.featureFlag.findUnique({
        where: { name: flagName },
      });

      if (!flag) {
        // Automatically default-create flags if missing
        flag = await prisma.featureFlag.create({
          data: {
            name: flagName,
            description: `Auto-initialized flag: ${flagName}`,
            isEnabled: false,
            rolloutPercent: 100,
          },
        });
      }
      
      await RedisCache.set(cacheKey, flag, this.CACHE_TTL_SECONDS);
    }

    // 2. Evaluate if globally disabled
    if (!flag.isEnabled) return false;

    // 3. Evaluate Role-based rollout rules
    if (flag.allowedRoles && flag.allowedRoles.length > 0) {
      if (!context?.userRole) return false;
      const hasRole = flag.allowedRoles.includes(context.userRole);
      if (!hasRole) return false;
    }

    // 4. Evaluate Canary percentage rules
    if (flag.rolloutPercent < 100 && context?.userId) {
      // Simple hash to determine if user falls inside rollout slot
      let hash = 0;
      for (let i = 0; i < context.userId.length; i++) {
        hash = context.userId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const slot = Math.abs(hash % 100);
      if (slot >= flag.rolloutPercent) return false;
    }

    return true;
  }
}
