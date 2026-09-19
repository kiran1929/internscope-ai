import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';
import { isIndiaLocation } from '../../location-utils';
import { isInternshipRole } from '../internship-filter';

export interface WorkdayConnectorConfig {
  tenant: string;
  wdServer: string;
  site: string;
  companyName: string;
  websiteUrl?: string;
  careerPageUrl?: string;
}

interface WorkdayListPosting {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

interface WorkdayJobPostingInfo {
  title?: string;
  location?: string;
  additionalLocations?: string[];
  jobDescription?: string;
  startDate?: string;
  timeType?: string;
  jobReqId?: string;
  jobPostingId?: string;
}

const MAX_LIST_JOBS = 300;
const PAGE_SIZE = 20;
const DETAIL_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WorkdayConnector implements Connector {
  public metadata: ScrapeSourceMetadata;
  private config: WorkdayConnectorConfig;
  private cxsBase: string;
  private host: string;

  constructor(config: WorkdayConnectorConfig) {
    this.config = config;
    this.host = `https://${config.tenant}.${config.wdServer}.myworkdayjobs.com`;
    this.cxsBase = `${this.host}/wday/cxs/${config.tenant}/${config.site}`;
    this.metadata = {
      id: `workday_${config.tenant}_${config.site}`,
      name: `Workday (${config.companyName})`,
      type: 'workday',
      enabled: true,
      url: `${this.cxsBase}/jobs`,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US',
      'User-Agent': 'InternScope-AI-Bot/1.0 (Internship Tracker)',
      Referer: `${this.host}/en-US/${this.config.site}`,
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    IngestionLogger.info(
      'Pipeline',
      `Fetching Workday postings for ${this.config.companyName}...`,
      this.metadata.id
    );

    const candidates: WorkdayListPosting[] = [];
    let offset = 0;

    try {
      while (candidates.length < MAX_LIST_JOBS) {
        const response = await fetch(`${this.cxsBase}/jobs`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            appliedFacets: {},
            limit: PAGE_SIZE,
            offset,
            searchText: 'intern',
          }),
          signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
          throw new Error(`Workday list API error: ${response.status} ${response.statusText}`);
        }

        const json = (await response.json()) as {
          total?: number;
          jobPostings?: WorkdayListPosting[];
        };

        const page = json.jobPostings ?? [];
        if (page.length === 0) break;

        for (const posting of page) {
          candidates.push(posting);
        }

        offset += PAGE_SIZE;
        const total = json.total ?? 0;
        if (offset >= total) break;
        await sleep(800);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      IngestionLogger.error(
        'Pipeline',
        `Workday fetch failed for ${this.config.companyName}: ${message}`,
        this.metadata.id,
        err instanceof Error ? err.stack : undefined
      );
      return [];
    }

    const enriched: Array<WorkdayListPosting & { detail?: WorkdayJobPostingInfo }> = [];

    for (const posting of candidates) {
      // Keep all intern search hits (global + India); pipeline still enforces internship-only
      try {
        const detailRes = await fetch(`${this.cxsBase}${posting.externalPath}`, {
          headers: { Accept: 'application/json', 'User-Agent': this.getHeaders()['User-Agent'] },
          signal: AbortSignal.timeout(15000),
        });
        if (detailRes.ok) {
          const detailJson = (await detailRes.json()) as { jobPostingInfo?: WorkdayJobPostingInfo };
          enriched.push({ ...posting, detail: detailJson.jobPostingInfo });
        } else {
          enriched.push(posting);
        }
      } catch {
        enriched.push(posting);
      }

      if (enriched.length >= MAX_LIST_JOBS) break;
      await sleep(DETAIL_DELAY_MS);
    }

    return enriched.map((item, index) => ({
      sourceId: this.metadata.id,
      externalJobId:
        item.detail?.jobReqId ||
        item.bulletFields?.[0] ||
        item.externalPath.split('/').pop() ||
        String(index),
      payload: item as unknown as Record<string, unknown>,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as unknown as WorkdayListPosting & {
      detail?: WorkdayJobPostingInfo;
    };
    const detail = payload.detail;
    const title = detail?.title || payload.title;
    const location =
      detail?.location ||
      [detail?.additionalLocations?.join(', '), payload.locationsText].filter(Boolean).join(' | ') ||
      'Remote';
    const description =
      detail?.jobDescription?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
      `${title} at ${this.config.companyName}.`;
    const isInternship = isInternshipRole(title, detail?.timeType, description);
    const regionTag = isIndiaLocation(location) ? 'india' : 'global';

    return {
      externalJobId: raw.externalJobId,
      title,
      companyName: this.config.companyName,
      companyWebsite: this.config.websiteUrl || this.host,
      location,
      remoteType: /remote/i.test(location) ? 'REMOTE' : 'ONSITE',
      type: isInternship ? 'INTERNSHIP' : 'FULL_TIME',
      salaryRange: 'Competitive stipend',
      applicationUrl: `${this.host}/en-US/${this.config.site}${payload.externalPath}`,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      description,
      requirements: 'Enrolled in an undergraduate or postgraduate program.',
      tags: ['workday', this.config.tenant, regionTag, isInternship ? 'internship' : 'job'],
    };
  }
}
