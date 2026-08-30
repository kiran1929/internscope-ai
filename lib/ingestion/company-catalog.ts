export type ScrapeProvider = 'greenhouse' | 'lever' | 'ashby';

export interface ScrapeBoard {
  name: string;
  provider: ScrapeProvider;
  boardToken: string;
  websiteUrl?: string;
  industry?: string;
  enabled?: boolean;
}

function gh(name: string, boardToken: string, websiteUrl?: string): ScrapeBoard {
  return {
    name,
    provider: 'greenhouse',
    boardToken,
    websiteUrl: websiteUrl ?? `https://${boardToken}.com`,
    industry: 'Technology',
    enabled: true,
  };
}

function lever(name: string, boardToken: string, websiteUrl?: string): ScrapeBoard {
  return {
    name,
    provider: 'lever',
    boardToken,
    websiteUrl: websiteUrl ?? `https://${boardToken}.com`,
    industry: 'Technology',
    enabled: true,
  };
}

function ashby(name: string, boardToken: string, websiteUrl?: string): ScrapeBoard {
  return {
    name,
    provider: 'ashby',
    boardToken,
    websiteUrl: websiteUrl ?? `https://${boardToken}.com`,
    industry: 'Technology',
    enabled: true,
  };
}

/** Curated list of public Greenhouse / Lever / Ashby job boards for tech internships. */
export const SCRAPE_COMPANY_CATALOG: ScrapeBoard[] = [
  // Greenhouse (70)
  gh('Stripe', 'stripe', 'https://stripe.com'),
  gh('Airbnb', 'airbnb', 'https://airbnb.com'),
  gh('Discord', 'discord', 'https://discord.com'),
  gh('Figma', 'figma', 'https://figma.com'),
  gh('Coinbase', 'coinbase', 'https://coinbase.com'),
  gh('Databricks', 'databricks', 'https://databricks.com'),
  gh('Dropbox', 'dropbox', 'https://dropbox.com'),
  gh('Reddit', 'reddit', 'https://reddit.com'),
  gh('Roblox', 'roblox', 'https://roblox.com'),
  gh('Snap', 'snap', 'https://snap.com'),
  gh('Twilio', 'twilio', 'https://twilio.com'),
  gh('Unity', 'unity', 'https://unity.com'),
  gh('Zendesk', 'zendesk', 'https://zendesk.com'),
  gh('Brex', 'brex', 'https://brex.com'),
  gh('Chime', 'chime', 'https://chime.com'),
  gh('DoorDash', 'doordash', 'https://doordash.com'),
  gh('Gusto', 'gusto', 'https://gusto.com'),
  gh('HubSpot', 'hubspot', 'https://hubspot.com'),
  gh('Instacart', 'instacart', 'https://instacart.com'),
  gh('Lyft', 'lyft', 'https://lyft.com'),
  gh('MongoDB', 'mongodb', 'https://mongodb.com'),
  gh('Okta', 'okta', 'https://okta.com'),
  gh('Pinterest', 'pinterest', 'https://pinterest.com'),
  gh('Plaid', 'plaid', 'https://plaid.com'),
  gh('Rippling', 'rippling', 'https://rippling.com'),
  gh('Robinhood', 'robinhood', 'https://robinhood.com'),
  gh('Shopify', 'shopify', 'https://shopify.com'),
  gh('SoFi', 'sofi', 'https://sofi.com'),
  gh('Squarespace', 'squarespace', 'https://squarespace.com'),
  gh('Toast', 'toast', 'https://toasttab.com'),
  gh('Twitch', 'twitch', 'https://twitch.tv'),
  gh('Uber', 'uber', 'https://uber.com'),
  gh('Zillow', 'zillow', 'https://zillow.com'),
  gh('Asana', 'asana', 'https://asana.com'),
  gh('Benchling', 'benchling', 'https://benchling.com'),
  gh('Checkr', 'checkr', 'https://checkr.com'),
  gh('Cloudflare', 'cloudflare', 'https://cloudflare.com'),
  gh('Coursera', 'coursera', 'https://coursera.org'),
  gh('Datadog', 'datadog', 'https://datadoghq.com'),
  gh('Duolingo', 'duolingo', 'https://duolingo.com'),
  gh('Elastic', 'elastic', 'https://elastic.co'),
  gh('Grammarly', 'grammarly', 'https://grammarly.com'),
  gh('HashiCorp', 'hashicorp', 'https://hashicorp.com'),
  gh('Intercom', 'intercom', 'https://intercom.com'),
  gh('Klaviyo', 'klaviyo', 'https://klaviyo.com'),
  gh('Lucid', 'lucid', 'https://lucid.co'),
  gh('Marqeta', 'marqeta', 'https://marqeta.com'),
  gh('Mercury', 'mercury', 'https://mercury.com'),
  gh('Miro', 'miro', 'https://miro.com'),
  gh('Niantic', 'niantic', 'https://nianticlabs.com'),
  gh('OpenAI', 'openai', 'https://openai.com'),
  gh('PagerDuty', 'pagerduty', 'https://pagerduty.com'),
  gh('Postman', 'postman', 'https://postman.com'),
  gh('Qualtrics', 'qualtrics', 'https://qualtrics.com'),
  gh('Retool', 'retool', 'https://retool.com'),
  gh('Sentry', 'sentry', 'https://sentry.io'),
  gh('Smartsheet', 'smartsheet', 'https://smartsheet.com'),
  gh('Snowflake', 'snowflake', 'https://snowflake.com'),
  gh('Tinder', 'tinder', 'https://tinder.com'),
  gh('Vercel', 'vercel', 'https://vercel.com'),
  gh('Wayfair', 'wayfair', 'https://wayfair.com'),
  gh('Webflow', 'webflow', 'https://webflow.com'),
  gh('Zapier', 'zapier', 'https://zapier.com'),
  gh('Zscaler', 'zscaler', 'https://zscaler.com'),
  gh('AMD', 'amd', 'https://amd.com'),
  gh('Atlassian', 'atlassian', 'https://atlassian.com'),
  gh('Autodesk', 'autodesk', 'https://autodesk.com'),
  gh('Box', 'box', 'https://box.com'),
  gh('Calendly', 'calendly', 'https://calendly.com'),
  gh('Canva', 'canva', 'https://canva.com'),

  // Lever (15)
  lever('Spotify', 'spotify', 'https://spotify.com'),
  lever('Netflix', 'netflix', 'https://netflix.com'),
  lever('Affirm', 'affirm', 'https://affirm.com'),
  lever('Binance', 'binance', 'https://binance.com'),
  lever('Curology', 'curology', 'https://curology.com'),
  lever('Flexport', 'flexport', 'https://flexport.com'),
  lever('Netlify', 'netlify', 'https://netlify.com'),
  lever('Quora', 'quora', 'https://quora.com'),
  lever('Thumbtack', 'thumbtack', 'https://thumbtack.com'),
  lever('Yelp', 'yelp', 'https://yelp.com'),
  lever('Scale AI', 'scale', 'https://scale.com'),
  lever('TripActions', 'tripactions', 'https://tripactions.com'),
  lever('Gopuff', 'gopuff', 'https://gopuff.com'),
  lever('Hopper', 'hopper', 'https://hopper.com'),
  lever('Riot Games', 'riotgames', 'https://riotgames.com'),

  // Ashby (15)
  ashby('Linear', 'linear', 'https://linear.app'),
  ashby('Notion', 'notion', 'https://notion.so'),
  ashby('Ramp', 'ramp', 'https://ramp.com'),
  ashby('Anthropic', 'anthropic', 'https://anthropic.com'),
  ashby('Deel', 'deel', 'https://deel.com'),
  ashby('Merge', 'merge', 'https://merge.dev'),
  ashby('Modern Treasury', 'moderntreasury', 'https://moderntreasury.com'),
  ashby('Oyster', 'oyster', 'https://oysterhr.com'),
  ashby('Persona', 'persona', 'https://withpersona.com'),
  ashby('Render', 'render', 'https://render.com'),
  ashby('Semgrep', 'semgrep', 'https://semgrep.com'),
  ashby('Vanta', 'vanta', 'https://vanta.com'),
  ashby('Watershed', 'watershed', 'https://watershed.com'),
  ashby('Zip', 'zip', 'https://ziphq.com'),
  ashby('Ashby', 'ashby', 'https://ashbyhq.com'),
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

export async function getEffectiveScrapeBoards(): Promise<ScrapeBoard[]> {
  try {
    const { prisma } = await import('../db');
    const dbCompanies = await prisma.company.findMany({
      where: {
        isArchived: false,
        careerPageUrl: { not: null },
      },
      select: {
        name: true,
        websiteUrl: true,
        careerPageUrl: true,
        industry: true,
        tags: true,
      },
    });

    if (dbCompanies.length > 0) {
      const dynamicBoards: ScrapeBoard[] = [];
      for (const comp of dbCompanies) {
        const url = comp.careerPageUrl || '';
        let provider: ScrapeProvider | null = null;
        let token = '';

        if (url.includes('greenhouse.io/')) {
          provider = 'greenhouse';
          token = url.split('greenhouse.io/')[1]?.split(/[\/?#]/)[0] || '';
        } else if (url.includes('jobs.lever.co/')) {
          provider = 'lever';
          token = url.split('jobs.lever.co/')[1]?.split(/[\/?#]/)[0] || '';
        } else if (url.includes('ashbyhq.com/')) {
          provider = 'ashby';
          token = url.split('ashbyhq.com/')[1]?.split(/[\/?#]/)[0] || '';
        }

        if (provider && token) {
          dynamicBoards.push({
            name: comp.name,
            provider,
            boardToken: token,
            websiteUrl: comp.websiteUrl ?? undefined,
            industry: comp.industry ?? 'Technology',
            enabled: true,
          });
        }
      }

      if (dynamicBoards.length > 0) {
        // Merge dynamic boards with static catalog ensuring uniqueness by provider + token
        const map = new Map<string, ScrapeBoard>();
        getEnabledCatalogBoards().forEach((b) => map.set(`${b.provider}_${b.boardToken.toLowerCase()}`, b));
        dynamicBoards.forEach((b) => map.set(`${b.provider}_${b.boardToken.toLowerCase()}`, b));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('[CompanyCatalog] Failed to load dynamic database scrape boards, using static catalog fallback:', err);
  }

  return getEnabledCatalogBoards();
}

export async function getEffectiveBoardsByProvider(provider: ScrapeProvider): Promise<ScrapeBoard[]> {
  const all = await getEffectiveScrapeBoards();
  return all.filter((b) => b.provider === provider);
}

export function buildCareerPageUrl(board: ScrapeBoard): string {
  switch (board.provider) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${board.boardToken}`;
    case 'lever':
      return `https://jobs.lever.co/${board.boardToken}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${board.boardToken}`;
  }
}
