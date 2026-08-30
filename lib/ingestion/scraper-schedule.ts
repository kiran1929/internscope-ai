/** IST scrape windows: 9:00 AM and 9:00 PM */
export const SCRAPE_CRON_IST = '0 9,21 * * *';
export const SCRAPE_TIMEZONE = 'Asia/Kolkata';

/** Next 9:00 AM or 9:00 PM IST after `from` (defaults to now). */
export function getNextScheduledScrapeTime(from: Date = new Date()): Date {
  const dateKey = from.toLocaleDateString('en-CA', { timeZone: SCRAPE_TIMEZONE });

  const slots = [
    new Date(`${dateKey}T09:00:00+05:30`),
    new Date(`${dateKey}T21:00:00+05:30`),
  ];

  const upcoming = slots.find((slot) => slot.getTime() > from.getTime());
  if (upcoming) return upcoming;

  const tomorrow = new Date(`${dateKey}T09:00:00+05:30`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function formatNextScrapeTimeIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: SCRAPE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
