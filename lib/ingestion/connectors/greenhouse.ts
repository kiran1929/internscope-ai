import { Connector } from '../connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from '../types';
import { ScraperProviderConfig, defaultScraperSettings } from '../config';
import { FetchError } from '../errors';

export class GreenhouseConnector implements Connector {
  private readonly config: ScraperProviderConfig;

  constructor(configOverride?: Partial<ScraperProviderConfig>) {
    this.config = {
      ...defaultScraperSettings.greenhouse,
      ...configOverride,
    };
  }

  public get metadata(): ScrapeSourceMetadata {
    return {
      id: `greenhouse_${this.config.boardToken}`,
      name: `Greenhouse (${this.config.boardToken})`,
      type: 'greenhouse',
      enabled: this.config.enabled,
      url: `${this.config.baseUrl}/${this.config.boardToken}/jobs`,
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    if (!this.config.enabled) {
      return [];
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.config.timeout);
    const targetUrl = `${this.config.baseUrl}/${this.config.boardToken}/jobs?content=true`;

    try {
      const response = await fetch(targetUrl, {
        headers: this.config.headers,
        signal: controller.signal,
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.jobs)) {
        throw new Error('Malformed Greenhouse API response structure: jobs array is missing.');
      }

      const rawJobs = data.jobs as Array<Record<string, unknown>>;

      return rawJobs.map((job) => ({
        sourceId: this.metadata.id,
        externalJobId: String(job.id || ''),
        payload: job,
        fetchedAt: new Date(),
      }));
    } catch (error) {
      clearTimeout(id);
      throw new FetchError(
        `Greenhouse fetch failed for URL: ${targetUrl}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as {
      id?: number | string;
      title?: string;
      location?: { name?: string };
      absolute_url?: string;
      content?: string;
      updated_at?: string;
      metadata?: Array<{ name: string; value: string }>;
    };

    if (!payload.id || !payload.title) {
      throw new Error(`Parse error: Greenhouse payload is missing ID or Title.`);
    }

    // Capitalize the board token for display name
    const companyDisplayName = this.config.boardToken.charAt(0).toUpperCase() + this.config.boardToken.slice(1);

    return {
      externalJobId: String(payload.id),
      title: payload.title,
      companyName: companyDisplayName,
      location: payload.location?.name || 'United States',
      applicationUrl: payload.absolute_url || '',
      description: payload.content || '',
      deadline: undefined,
    };
  }
}
