import { Connector } from '../connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from '../types';
import { ScraperProviderConfig, defaultScraperSettings } from '../config';
import { FetchError } from '../errors';

export class LeverConnector implements Connector {
  private readonly config: ScraperProviderConfig;

  constructor(configOverride?: Partial<ScraperProviderConfig>) {
    this.config = {
      ...defaultScraperSettings.lever,
      ...configOverride,
    };
  }

  public get metadata(): ScrapeSourceMetadata {
    return {
      id: `lever_${this.config.boardToken}`,
      name: `Lever (${this.config.boardToken})`,
      type: 'lever',
      enabled: this.config.enabled,
      url: `${this.config.baseUrl}/${this.config.boardToken}`,
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    if (!this.config.enabled) {
      return [];
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.config.timeout);
    const targetUrl = `${this.config.baseUrl}/${this.config.boardToken}?mode=json`;

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
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Malformed Lever API response structure: root is not an array.');
      }

      const rawPostings = data as Array<Record<string, unknown>>;

      return rawPostings.map((posting) => ({
        sourceId: this.metadata.id,
        externalJobId: String(posting.id || ''),
        payload: posting,
        fetchedAt: new Date(),
      }));
    } catch (error) {
      clearTimeout(id);
      throw new FetchError(
        `Lever fetch failed for URL: ${targetUrl}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as {
      id?: string;
      text?: string; // Title
      hostedUrl?: string;
      description?: string;
      descriptionBody?: string;
      categories?: {
        location?: string;
        commitment?: string;
        team?: string;
      };
      workplaceType?: string;
    };

    if (!payload.id || !payload.text) {
      throw new Error(`Parse error: Lever payload is missing ID or Title (text).`);
    }

    const companyDisplayName =
      this.config.companyName ??
      this.config.boardToken.charAt(0).toUpperCase() + this.config.boardToken.slice(1);

    return {
      externalJobId: payload.id,
      title: payload.text,
      companyName: companyDisplayName,
      companyWebsite: this.config.websiteUrl,
      location: payload.categories?.location || 'United States',
      remoteType: payload.workplaceType || '',
      type: payload.categories?.commitment || '',
      applicationUrl: payload.hostedUrl || '',
      description: payload.description || payload.descriptionBody || '',
    };
  }
}
