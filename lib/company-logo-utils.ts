const KNOWN_BRAND_CODES = new Set([
  'MSFT', 'GOOG', 'AAPL', 'AMZN', 'META', 'NVDA', 'OPENAI', 'ANTH', 'STRIPE',
  'TEAM', 'DATABRICKS', 'SNOW', 'NET', 'NFLX', 'SPOT', 'CUSTOM',
]);

const WELL_KNOWN_DOMAINS: Record<string, string> = {
  amd: 'amd.com',
  affirm: 'affirm.com',
  airbnb: 'airbnb.com',
  amazon: 'amazon.com',
  anthropic: 'anthropic.com',
  apple: 'apple.com',
  asana: 'asana.com',
  ashby: 'ashbyhq.com',
  atlassian: 'atlassian.com',
  autodesk: 'autodesk.com',
  benchling: 'benchling.com',
  binance: 'binance.com',
  bloomberg: 'bloomberg.com',
  box: 'box.com',
  bytedance: 'bytedance.com',
  canva: 'canva.com',
  cisco: 'cisco.com',
  cloudflare: 'cloudflare.com',
  coinbase: 'coinbase.com',
  crowdstrike: 'crowdstrike.com',
  datadog: 'datadoghq.com',
  databricks: 'databricks.com',
  discord: 'discord.com',
  doordash: 'doordash.com',
  dropbox: 'dropbox.com',
  duolingo: 'duolingo.com',
  epicgames: 'epicgames.com',
  figma: 'figma.com',
  github: 'github.com',
  gitlab: 'gitlab.com',
  google: 'google.com',
  grammarly: 'grammarly.com',
  gusto: 'gusto.com',
  hubspot: 'hubspot.com',
  ibm: 'ibm.com',
  intel: 'intel.com',
  intuit: 'intuit.com',
  klarna: 'klarna.com',
  linkedin: 'linkedin.com',
  lyft: 'lyft.com',
  meta: 'meta.com',
  microsoft: 'microsoft.com',
  mongodb: 'mongodb.com',
  netflix: 'netflix.com',
  notion: 'notion.so',
  nvidia: 'nvidia.com',
  openai: 'openai.com',
  oracle: 'oracle.com',
  palantir: 'palantir.com',
  paypal: 'paypal.com',
  pinterest: 'pinterest.com',
  plaid: 'plaid.com',
  qualcomm: 'qualcomm.com',
  razorpay: 'razorpay.com',
  reddit: 'reddit.com',
  rippling: 'rippling.com',
  roblox: 'roblox.com',
  salesforce: 'salesforce.com',
  scaleai: 'scale.com',
  scale: 'scale.com',
  servicenow: 'servicenow.com',
  shopify: 'shopify.com',
  slack: 'slack.com',
  snap: 'snap.com',
  snowflake: 'snowflake.com',
  spotify: 'spotify.com',
  square: 'squareup.com',
  block: 'squareup.com',
  stripe: 'stripe.com',
  supabase: 'supabase.com',
  tesla: 'tesla.com',
  tiktok: 'tiktok.com',
  twilio: 'twilio.com',
  twitter: 'x.com',
  x: 'x.com',
  uber: 'uber.com',
  unity: 'unity.com',
  vercel: 'vercel.com',
  wayfair: 'wayfair.com',
  workday: 'workday.com',
  zoom: 'zoom.us',
  zs: 'zs.com',
};

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

export function buildClearbitLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
}

export function buildUnavatarLogoUrl(domain: string): string {
  return `https://unavatar.io/${encodeURIComponent(domain)}?fallback=false`;
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

export function resolveDomain(input: CompanyLogoSourceInput): string | null {
  const fromUrl =
    extractDomainFromUrl(input.websiteUrl) ||
    extractDomainFromUrl(input.applicationUrl);

  if (fromUrl) return fromUrl;

  if (input.companyName) {
    const cleanKey = input.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (WELL_KNOWN_DOMAINS[cleanKey]) {
      return WELL_KNOWN_DOMAINS[cleanKey];
    }
    // Fallback guess: <cleanname>.com
    if (cleanKey.length >= 3) {
      return `${cleanKey}.com`;
    }
  }

  return null;
}

/** Best primary logo URL to try first in the UI (Clearbit HD first, then Unavatar, then Favicon). */
export function resolveCompanyLogoUrl(input: CompanyLogoSourceInput): string | null {
  if (isHttpUrl(input.logoUrl)) {
    return input.logoUrl.trim();
  }

  const domain = resolveDomain(input);
  if (!domain) return null;

  return buildClearbitLogoUrl(domain);
}

/** Secondary sources tried client-side when the primary image fails to load. */
export function getCompanyLogoFallbackUrls(input: CompanyLogoSourceInput): string[] {
  const domain = resolveDomain(input);
  if (!domain) return [];

  const clearbit = buildClearbitLogoUrl(domain);
  const unavatar = buildUnavatarLogoUrl(domain);
  const google = buildGoogleFaviconUrl(domain, 128);
  const duck = buildDuckDuckGoIconUrl(domain);
  const primary = resolveCompanyLogoUrl(input);

  const fallbacks = [unavatar, google, duck, clearbit].filter((url) => url && url !== primary);
  return [...new Set(fallbacks)];
}
