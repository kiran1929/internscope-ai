import { prisma } from '../db';
import {
  ScrapeBoard,
  ScrapeProvider,
  getEnabledCatalogBoards,
} from './company-catalog';

/**
 * Server-only Dynamic Catalog Loader
 * Loads active scrape boards from PostgreSQL at runtime with fallback to static catalog (CRIT-001).
 */
export async function getEffectiveScrapeBoards(): Promise<ScrapeBoard[]> {
  try {
    const dbCompanies = await prisma.company.findMany({
      where: {
        isArchived: false,
        careerPageUrl: { not: null },
      },
      select: {
        name: true,
        websiteUrl: true,
        careerPageUrl: true,
        industry: true,
        tags: true,
      },
    });

    if (dbCompanies.length > 0) {
      const dynamicBoards: ScrapeBoard[] = [];
      for (const comp of dbCompanies) {
        const url = comp.careerPageUrl || '';
        let provider: ScrapeProvider | null = null;
        let token = '';

        if (url.includes('greenhouse.io/')) {
          provider = 'greenhouse';
          token = url.split('greenhouse.io/')[1]?.split(/[\/?#]/)[0] || '';
        } else if (url.includes('jobs.lever.co/')) {
          provider = 'lever';
          token = url.split('jobs.lever.co/')[1]?.split(/[\/?#]/)[0] || '';
        } else if (url.includes('ashbyhq.com/')) {
          provider = 'ashby';
          token = url.split('ashbyhq.com/')[1]?.split(/[\/?#]/)[0] || '';
        }

        if (provider && token) {
          dynamicBoards.push({
            name: comp.name,
            provider,
            boardToken: token,
            websiteUrl: comp.websiteUrl ?? undefined,
            industry: comp.industry ?? 'Technology',
            enabled: true,
          });
        }
      }

      if (dynamicBoards.length > 0) {
        const map = new Map<string, ScrapeBoard>();
        getEnabledCatalogBoards().forEach((b) => map.set(`${b.provider}_${b.boardToken.toLowerCase()}`, b));
        dynamicBoards.forEach((b) => map.set(`${b.provider}_${b.boardToken.toLowerCase()}`, b));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('[DynamicCatalog] Failed to load database scrape boards, using static catalog fallback:', err);
  }

  return getEnabledCatalogBoards();
}

export async function getEffectiveBoardsByProvider(provider: ScrapeProvider): Promise<ScrapeBoard[]> {
  const all = await getEffectiveScrapeBoards();
  return all.filter((b) => b.provider === provider);
}
