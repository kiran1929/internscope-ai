import { Connector } from '../connector';
import { ScrapeSourceMetadata, RawOpportunity, ParsedOpportunity } from '../types';
import { ScraperProviderConfig, defaultScraperSettings } from '../config';
import { FetchError } from '../errors';
import { greenhouseResponseSchema, greenhouseJobSchema } from '../schemas';

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

  async fetchRaw(since?: Date): Promise<RawOpportunity[]> {
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

      const json = await response.json();
      const parsed = greenhouseResponseSchema.safeParse(json);
      
      if (!parsed.success) {
        throw new Error(`Malformed Greenhouse API response structure: ${parsed.error.message}`);
      }

      let rawJobs = parsed.data.jobs;

      // Delta sync filtering (CRIT-002)
      if (since) {
        const sinceTime = since.getTime();
        rawJobs = rawJobs.filter((job) => {
          if (!job.updated_at) return true;
          const updatedAt = new Date(job.updated_at).getTime();
          return isNaN(updatedAt) || updatedAt >= sinceTime;
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
        `Greenhouse fetch failed for URL: ${targetUrl}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const parsedPayload = greenhouseJobSchema.safeParse(raw.payload);
    if (!parsedPayload.success) {
      throw new Error(`Parse error: Invalid Greenhouse payload structure (${parsedPayload.error.message})`);
    }

    const payload = parsedPayload.data;

    // Capitalize the board token for display name unless overridden
    const companyDisplayName =
      this.config.companyName ??
      this.config.boardToken.charAt(0).toUpperCase() + this.config.boardToken.slice(1);

    const locationName = typeof payload.location === 'string'
      ? payload.location
      : payload.location?.name || 'United States';

    const metadataArray = (payload as any).metadata as Array<{ name: string; value: string }> | undefined;
    const metadataDeadline = metadataArray?.find((m) =>
      /deadline|close|due/i.test(m.name)
    )?.value;

    return {
      externalJobId: String(payload.id),
      title: payload.title,
      companyName: companyDisplayName,
      companyWebsite: this.config.websiteUrl,
      location: locationName,
      applicationUrl: payload.absolute_url || '',
      description: payload.content || '',
      deadline: metadataDeadline,
    };
  }
}
