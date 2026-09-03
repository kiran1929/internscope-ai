import { prisma } from '../db';
import {
  buildCareerPageUrl,
  getEnabledCatalogBoards,
  getCatalogCompanyCount,
} from './company-catalog';

export async function syncCatalogToDatabase(): Promise<{ upserted: number }> {
  const boards = getEnabledCatalogBoards();
  let upserted = 0;

  for (const board of boards) {
    const careerPageUrl = buildCareerPageUrl(board);
    await prisma.company.upsert({
      where: { name: board.name },
      create: {
        name: board.name,
        websiteUrl: board.websiteUrl ?? null,
        careerPageUrl,
        industry: board.industry ?? 'Technology',
        isVerified: true,
        hiringStatus: 'HIRING',
        tags: [
          board.provider,
          'scraper-catalog',
          'india',
          'internship',
          ...(board.region === 'india' ? ['india-ats'] : []),
        ],
      },
      update: {
        websiteUrl: board.websiteUrl ?? null,
        careerPageUrl,
        industry: board.industry ?? 'Technology',
        isVerified: true,
        hiringStatus: 'HIRING',
        tags: [
          board.provider,
          'scraper-catalog',
          'india',
          'internship',
          ...(board.region === 'india' ? ['india-ats'] : []),
        ],
      },
    });
    upserted += 1;
  }

  return { upserted };
}

export { getCatalogCompanyCount };
