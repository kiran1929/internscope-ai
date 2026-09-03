/**
 * Validates and normalizes candidate-facing application URLs.
 * Blocks ATS API endpoints and generic careers homepages.
 */

const BLOCKED_API_HOSTS = new Set([
  'api.smartrecruiters.com',
  'boards-api.greenhouse.io',
  'api.lever.co',
  'api.ashbyhq.com',
  'api.jobvetta.com',
]);

const GENERIC_CAREERS_PATTERNS = [
  /\/careers\/?$/i,
  /\/careers\/internships\/?$/i,
  /\/careers\/students\/?$/i,
  /\/company\/careers\/?$/i,
  /\/jobs\/?$/i,
  /\/jobs\/search/i,
  /\/jobsearch/i,
  /\/careers\/job\/\?/i,
  /\/search\?/i,
  /example\.com/i,
];

export function isApiApplicationUrl(url: string): boolean {
  if (!url?.trim()) return true;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '');
    if (BLOCKED_API_HOSTS.has(host)) return true;
    return /\/v\d+\/companies\//i.test(url) || url.includes('/postings/') && host.includes('api.');
  } catch {
    return true;
  }
}

export function isGenericCareersUrl(url: string): boolean {
  if (!url?.trim()) return true;
  const normalized = url.trim();
  if (isApiApplicationUrl(normalized)) return true;
  return GENERIC_CAREERS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildSmartRecruitersJobUrl(companyIdentifier: string, postingId: string): string {
  return `https://jobs.smartrecruiters.com/${companyIdentifier}/${postingId}`;
}

export async function fetchSmartRecruitersApplicationUrl(
  companyIdentifier: string,
  postingId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${companyIdentifier}/postings/${postingId}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'InternScope-AI-Bot/1.0',
        },
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!response.ok) return null;
    const detail = (await response.json()) as {
      applyUrl?: string;
      postingUrl?: string;
    };
    return detail.applyUrl || detail.postingUrl || null;
  } catch {
    return null;
  }
}

export function sanitizeApplicationUrl(url: string, fallback?: string): string {
  const trimmed = url?.trim() || '';
  if (trimmed && !isApiApplicationUrl(trimmed) && !isGenericCareersUrl(trimmed)) {
    return trimmed;
  }
  const fb = fallback?.trim() || '';
  if (fb && !isApiApplicationUrl(fb) && !isGenericCareersUrl(fb)) {
    return fb;
  }
  return trimmed;
}

export function isAcceptableApplicationUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (isApiApplicationUrl(url) || isGenericCareersUrl(url)) return false;
  return isDirectApplicationUrl(url);
}

/** Direct job posting URLs (public apply pages). */
export function isDirectApplicationUrl(url: string): boolean {
  if (!url || !url.trim()) return false;

  if (isApiApplicationUrl(url)) return false;

  const normalized = url.trim().toLowerCase();

  try {
    const parsed = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'jobs.smartrecruiters.com' && path.split('/').filter(Boolean).length >= 2) {
      return true;
    }

    // JobVetta public job pages (candidate-facing, link to employer source)
    if (
      (host === 'jobvetta.com' || host === 'www.jobvetta.com') &&
      /^\/jobs\/[^/]+$/i.test(path)
    ) {
      return true;
    }

    if (host.includes('myworkdayjobs.com') && /\/job\//i.test(path)) {
      return true;
    }

    if (/amazon\.jobs$/.test(host) && /\/jobs\/\d+/.test(path)) return true;
    if (host === 'careers.google.com' && /\/jobs\/results\/\d+-/.test(path)) return true;
    if (host === 'buildyourfuture.withgoogle.com' && path.includes('/step')) return true;
    if (host === 'summerofcode.withgoogle.com' && path.includes('/programs/')) return true;
    if (host === 'research.google' && path.includes('/outreach/')) return true;
    if (host === 'explore.jobs.netflix.net' && /\/careers\/job\/\d+/.test(path)) return true;
    if (host === 'apply.careers.microsoft.com' && /\/careers\/job\/\d+/.test(path)) return true;
    if (host === 'metacareers.com' && /\/jobs\/\d+/.test(path)) return true;
    if (host === 'jobs.apple.com' && /\/details\/\d+/.test(path)) return true;
    if (host === 'stripe.com' && /\/careers\/listing\//.test(path)) return true;
    if (/boards\.greenhouse\.io/.test(host) && path.length > 1) return true;
    if (/jobs\.lever\.co/.test(host) && path.length > 1) return true;
    if (/jobs\.ashbyhq\.com/.test(host) && path.length > 1) return true;

    if (isGenericCareersUrl(url)) return false;

    if (host === 'apply.careers.microsoft.com' && parsed.search.includes('query=')) return false;

    return path.length > 1 && path !== '/careers';
  } catch {
    return false;
  }
}

export function normalizeApplicationUrl(url: string, fallbackUrl?: string): string {
  const trimmed = url?.trim() || '';
  if (trimmed && isDirectApplicationUrl(trimmed)) return trimmed;
  if (fallbackUrl?.trim() && isDirectApplicationUrl(fallbackUrl)) return fallbackUrl.trim();
  return sanitizeApplicationUrl(trimmed, fallbackUrl);
}
