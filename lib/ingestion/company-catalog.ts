import { getIndianAtsBoards } from './indian-ats-catalog';
import { getIndianSmartRecruitersBoards } from './indian-smartrecruiters-catalog';
import { getIndianWorkdayBoards } from './indian-workday-catalog';

export type ScrapeProvider =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'smartrecruiters'
  | 'workday';

export interface ScrapeBoard {
  name: string;
  provider: ScrapeProvider;
  boardToken: string;
  /** Workday tenant slug (e.g. nvidia). */
  tenant?: string;
  /** Workday datacenter host segment (e.g. wd5). */
  wdServer?: string;
  websiteUrl?: string;
  industry?: string;
  region?: 'india' | 'global';
  enabled?: boolean;
}

/** India-focused ATS catalog: SmartRecruiters + Workday GCCs + GH/Lever/Ashby startups. */
export const SCRAPE_COMPANY_CATALOG: ScrapeBoard[] = [
  ...getIndianSmartRecruitersBoards(),
  ...getIndianWorkdayBoards(),
  ...getIndianAtsBoards(),
];

export function getEnabledCatalogBoards(): ScrapeBoard[] {
  return SCRAPE_COMPANY_CATALOG.filter((board) => board.enabled !== false);
}

export function getCatalogBoardsByProvider(provider: ScrapeProvider): ScrapeBoard[] {
  return getEnabledCatalogBoards().filter((board) => board.provider === provider);
}

export function getCatalogCompanyCount(): number {
  return getEnabledCatalogBoards().length;
}

export function buildCareerPageUrl(board: ScrapeBoard): string {
  switch (board.provider) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${board.boardToken}`;
    case 'lever':
      return `https://jobs.lever.co/${board.boardToken}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${board.boardToken}`;
    case 'smartrecruiters':
      return `https://jobs.smartrecruiters.com/${board.boardToken}`;
    case 'workday':
      return `https://${board.tenant}.${board.wdServer}.myworkdayjobs.com/en-US/${board.boardToken}`;
  }
}
