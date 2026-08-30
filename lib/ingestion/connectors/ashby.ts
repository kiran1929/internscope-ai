import { Connector } from '../connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from '../types';
import { ScraperProviderConfig, defaultScraperSettings } from '../config';
import { FetchError } from '../errors';
import { ashbyResponseSchema, ashbyJobSchema } from '../schemas';

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

  async fetchRaw(since?: Date): Promise<RawOpportunity[]> {
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

      const json = await response.json();
      const parsed = ashbyResponseSchema.safeParse(json);
      
      if (!parsed.success) {
        throw new Error(`Malformed Ashby API response structure: ${parsed.error.message}`);
      }

      let rawJobs = parsed.data.jobs || parsed.data.results || [];

      // Delta sync filtering (CRIT-002)
      if (since) {
        const sinceTime = since.getTime();
        rawJobs = rawJobs.filter((job) => {
          if (!job.publishedAt) return true;
          const publishedAt = new Date(job.publishedAt).getTime();
          return isNaN(publishedAt) || publishedAt >= sinceTime;
        });
      }

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
    const parsedPayload = ashbyJobSchema.safeParse(raw.payload);
    if (!parsedPayload.success) {
      throw new Error(`Parse error: Invalid Ashby payload structure (${parsedPayload.error.message})`);
    }

    const payload = parsedPayload.data;

    const companyDisplayName =
      this.config.companyName ??
      this.config.boardToken.charAt(0).toUpperCase() + this.config.boardToken.slice(1);

    const locationStr = typeof payload.location === 'string'
      ? payload.location
      : payload.locationName || 'United States';

    return {
      externalJobId: payload.id,
      title: payload.title,
      companyName: companyDisplayName,
      companyWebsite: this.config.websiteUrl,
      location: locationStr,
      remoteType: payload.isRemote ? 'REMOTE' : locationStr,
      type: payload.employmentType || '',
      applicationUrl: payload.applyUrl || payload.jobUrl || '',
      description: payload.descriptionPlain || payload.descriptionHtml || '',
      salaryRange: typeof (payload as any).compensationTierSummary === 'string' ? (payload as any).compensationTierSummary : undefined,
    };
  }
}
