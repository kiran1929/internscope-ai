/**
 * Detects whether an application URL points to a specific job posting
 * vs. a generic careers landing page, team page, or search results.
 */
export function isDirectApplicationUrl(url: string): boolean {
  if (!url || !url.trim()) return false;

  const normalized = url.trim().toLowerCase();

  try {
    const parsed = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    const host = parsed.hostname.replace(/^www\./, '');

    // Amazon — /en/jobs/{id}/...
    if (/amazon\.jobs$/.test(host) && /\/jobs\/\d+/.test(path)) return true;

    // Google Careers — /jobs/results/{numeric-id}-slug
    if (host === 'careers.google.com' && /\/jobs\/results\/\d+-/.test(path)) return true;

    // Google STEP portal
    if (host === 'buildyourfuture.withgoogle.com' && path.includes('/step')) return true;

    // Google Summer of Code program page (direct application portal)
    if (host === 'summerofcode.withgoogle.com' && path.includes('/programs/')) return true;

    // Google Research fellowship (program-specific application page)
    if (host === 'research.google' && path.includes('/outreach/')) return true;

    // Netflix — explore.jobs.netflix.net/careers/job/{id}
    if (host === 'explore.jobs.netflix.net' && /\/careers\/job\/\d+/.test(path)) return true;

    // Microsoft — /careers/job/{numeric-id}
    if (host === 'apply.careers.microsoft.com' && /\/careers\/job\/\d+/.test(path)) return true;

    // Meta — /jobs/{numeric-id}
    if (host === 'metacareers.com' && /\/jobs\/\d+/.test(path)) return true;

    // Apple — /en-us/details/{id}/
    if (host === 'jobs.apple.com' && /\/details\/\d+/.test(path)) return true;

    // Stripe — /careers/listing/{slug}/{id}
    if (host === 'stripe.com' && /\/careers\/listing\//.test(path)) return true;

    // Greenhouse / Lever / Ashby (ingested jobs)
    if (/boards\.greenhouse\.io/.test(host) && path.length > 1) return true;
    if (/jobs\.lever\.co/.test(host) && path.length > 1) return true;
    if (/jobs\.ashbyhq\.com/.test(host) && path.length > 1) return true;

    // Generic patterns — NOT direct job postings
    const genericPatterns = [
      /\/teams\//,
      /\/careerprograms\//,
      /\/jobs\/results\/\?/,
      /\/jobs\/results\?/,
      /\/search\?/,
      /\/careers\?/,
      /\/careers\/search/,
      /\/careers\/internships\/?$/,
      /\/careers\/?$/,
      /\/jobsearch\/?$/,
      /\/content\/en\/career-programs\//,
      /llama\.meta\.com$/,
      /machinelearning\.apple\.com$/,
      /\/about\/careers\/applications\//,
    ];

    if (genericPatterns.some((pattern) => pattern.test(normalized))) return false;

    // Filtered Microsoft search pages (query=...) — listing pages, not a single job
    if (host === 'apply.careers.microsoft.com' && parsed.search.includes('query=')) return false;

    // Has a meaningful path beyond root — treat as potentially direct
    return path.length > 1 && path !== '/careers';
  } catch {
    return false;
  }
}

export function normalizeApplicationUrl(url: string, fallbackUrl?: string): string {
  const trimmed = url?.trim() || '';
  if (trimmed && isDirectApplicationUrl(trimmed)) return trimmed;
  if (fallbackUrl?.trim()) return fallbackUrl.trim();
  return trimmed;
}
