import { Connector } from '../connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from '../types';
import { ScraperProviderConfig, defaultScraperSettings } from '../config';
import { FetchError } from '../errors';

export class AshbyConnector implements Connector {
  private readonly config: ScraperProviderConfig;

  constructor(configOverride?: Partial<ScraperProviderConfig>) {
    this.config = {
      ...defaultScraperSettings.ashby,
      ...configOverride,
    };
  }

  public get metadata(): ScrapeSourceMetadata {
    return {
      id: `ashby_${this.config.boardToken}`,
      name: `Ashby (${this.config.boardToken})`,
      type: 'ashby',
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
    const targetUrl = `${this.config.baseUrl}/${this.config.boardToken}?includeCompensation=true`;

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
        throw new Error('Malformed Ashby API response structure: jobs array is missing.');
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
        `Ashby fetch failed for URL: ${targetUrl}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as {
      id?: string;
      title?: string;
      descriptionHtml?: string;
      descriptionPlain?: string;
      employmentType?: string;
      location?: string;
      department?: string;
      applyUrl?: string;
      jobUrl?: string;
      compensationTierSummary?: string;
    };

    if (!payload.id || !payload.title) {
      throw new Error(`Parse error: Ashby payload is missing ID or Title.`);
    }

    const companyDisplayName =
      this.config.companyName ??
      this.config.boardToken.charAt(0).toUpperCase() + this.config.boardToken.slice(1);

    return {
      externalJobId: payload.id,
      title: payload.title,
      companyName: companyDisplayName,
      companyWebsite: this.config.websiteUrl,
      location: payload.location || 'United States',
      remoteType: payload.location || '',
      type: payload.employmentType || '',
      applicationUrl: payload.applyUrl || payload.jobUrl || '',
      description: payload.descriptionHtml || payload.descriptionPlain || '',
      salaryRange: payload.compensationTierSummary || undefined,
    };
  }
}
