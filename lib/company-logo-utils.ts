const KNOWN_BRAND_CODES = new Set([
  'MSFT', 'GOOG', 'AAPL', 'AMZN', 'META', 'NVDA', 'OPENAI', 'ANTH', 'STRIPE',
  'TEAM', 'DATABRICKS', 'SNOW', 'NET', 'NFLX', 'SPOT', 'CUSTOM',
]);

export function isHttpUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value.trim());
}

export function isLegacyBrandCode(value: string | null | undefined): boolean {
  if (!value) return false;
  return KNOWN_BRAND_CODES.has(value.trim().toUpperCase());
}

export function extractDomainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(normalized).hostname.replace(/^www\./i, '');

    const parts = hostname.split('.').filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }

    return hostname || null;
  } catch {
    return null;
  }
}

export function buildGoogleFaviconUrl(domain: string, size = 128): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function buildDuckDuckGoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

export interface CompanyLogoSourceInput {
  logoUrl?: string | null;
  websiteUrl?: string | null;
  applicationUrl?: string | null;
  companyName?: string;
}

function resolveDomain(input: CompanyLogoSourceInput): string | null {
  return (
    extractDomainFromUrl(input.websiteUrl) ||
    extractDomainFromUrl(input.applicationUrl)
  );
}

/** Best primary logo URL to try first in the UI. */
export function resolveCompanyLogoUrl(input: CompanyLogoSourceInput): string | null {
  const domain = resolveDomain(input);
  const favicon = domain ? buildGoogleFaviconUrl(domain) : null;

  if (isHttpUrl(input.logoUrl)) {
    return input.logoUrl.trim();
  }

  return favicon;
}

/** Secondary sources tried client-side when the primary image fails to load. */
export function getCompanyLogoFallbackUrls(input: CompanyLogoSourceInput): string[] {
  const domain = resolveDomain(input);
  if (!domain) return [];

  const favicon = buildGoogleFaviconUrl(domain);
  const duck = buildDuckDuckGoIconUrl(domain);
  const primary = resolveCompanyLogoUrl(input);

  const fallbacks = [favicon, duck].filter((url) => url && url !== primary);
  return [...new Set(fallbacks)];
}
