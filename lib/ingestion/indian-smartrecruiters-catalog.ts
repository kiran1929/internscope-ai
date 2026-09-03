import type { ScrapeBoard } from './company-catalog';

function sr(name: string, boardToken: string, websiteUrl: string): ScrapeBoard {
  return {
    name,
    provider: 'smartrecruiters',
    boardToken,
    websiteUrl,
    industry: 'Technology',
    region: 'india',
    enabled: true,
  };
}

/**
 * Indian companies on SmartRecruiters with verified India internship postings (q=intern).
 */
export const INDIAN_SMARTRECRUITERS_BOARDS: ScrapeBoard[] = [
  sr('Bosch India', 'BoschGroup', 'https://bosch.in'),
  sr('Continental India', 'Continental', 'https://continental.com'),
  sr('Swiggy', 'Swiggy', 'https://swiggy.com'),
  sr('Freshworks', 'Freshworks', 'https://freshworks.com'),
  sr('Endava India', 'Endava', 'https://endava.com'),
  sr('Ixigo', 'Ixigo', 'https://ixigo.com'),
  sr('Ubisoft India', 'Ubisoft2', 'https://ubisoft.com'),
];

export function getIndianSmartRecruitersBoards(): ScrapeBoard[] {
  return INDIAN_SMARTRECRUITERS_BOARDS.filter((board) => board.enabled !== false);
}
