/** When false, scheduled and manual scraper runs are blocked. */
export function isScrapingEnabled(): boolean {
  return process.env.SCRAPING_ENABLED === 'true';
}

export const SCRAPING_DISABLED_MESSAGE =
  'Scraping is disabled. Set SCRAPING_ENABLED=true in your environment to run sync jobs.';
