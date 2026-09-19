import type { ScrapeBoard } from './company-catalog';

function wd(
  name: string,
  tenant: string,
  wdServer: string,
  site: string,
  websiteUrl: string
): ScrapeBoard {
  return {
    name,
    provider: 'workday',
    boardToken: site,
    tenant,
    wdServer,
    websiteUrl,
    industry: 'Technology',
    region: 'india',
    enabled: true,
  };
}

/**
 * Global capability centers in India on Workday public career sites (CXS JSON API).
 */
export const INDIAN_WORKDAY_BOARDS: ScrapeBoard[] = [
  wd('NVIDIA India', 'nvidia', 'wd5', 'NVIDIAExternalCareerSite', 'https://nvidia.com'),
  wd('Accenture India', 'accenture', 'wd103', 'AccentureCareers', 'https://accenture.com'),
  wd('Salesforce India', 'salesforce', 'wd12', 'External_Career_Site', 'https://salesforce.com'),
  wd('Adobe India', 'adobe', 'wd5', 'external_experienced', 'https://adobe.com'),
  wd('HP India', 'hp', 'wd5', 'ExternalCareerSite', 'https://hp.com'),
  wd('Intel India', 'intel', 'wd1', 'External', 'https://intel.com'),
  wd('Cadence India', 'cadence', 'wd1', 'External_Careers', 'https://cadence.com'),
];

export function getIndianWorkdayBoards(): ScrapeBoard[] {
  return INDIAN_WORKDAY_BOARDS.filter((board) => board.enabled !== false);
}
