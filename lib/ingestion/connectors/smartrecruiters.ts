import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';
import { isIndiaLocation } from '../../location-utils';

import { isInternshipRole } from '../internship-filter';
import {
  buildSmartRecruitersJobUrl,
  fetchSmartRecruitersApplicationUrl,
} from '../../opportunities/application-url';

export interface SmartRecruitersConnectorConfig {
  boardToken: string;
  companyName: string;
  websiteUrl?: string;
  careerPageUrl?: string;
}

export class SmartRecruitersConnector implements Connector {
  public metadata: ScrapeSourceMetadata;
  private config: SmartRecruitersConnectorConfig;

  constructor(config: SmartRecruitersConnectorConfig) {
    this.config = config;
    this.metadata = {
      id: `smartrecruiters_${config.boardToken.toLowerCase()}`,
      name: `SmartRecruiters (${config.companyName})`,
      type: 'smartrecruiters',
      enabled: true,
      url: `https://api.smartrecruiters.com/v1/companies/${config.boardToken}/postings?q=intern`,
    };
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    IngestionLogger.info('Pipeline', `Fetching SmartRecruiters postings for ${this.config.companyName}...`, this.metadata.id);

    // Global internship search (no country=in restriction)
    const baseUrl = `https://api.smartrecruiters.com/v1/companies/${this.config.boardToken}/postings?q=intern&limit=100`;
    const allPostings: Record<string, unknown>[] = [];
    let offset = 0;

    try {
      while (true) {
        const pageUrl = `${baseUrl}&offset=${offset}`;
        const response = await fetch(pageUrl, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'InternScope-AI-Bot/1.0 (Internship Tracker)',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          if (response.status === 404) {
            IngestionLogger.warn(
              'Pipeline',
              `SmartRecruiters board not found for ${this.config.boardToken}`,
              this.metadata.id
            );
            return [];
          }
          throw new Error(`SmartRecruiters API error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const postings = Array.isArray(json?.content) ? json.content : [];
        allPostings.push(...postings);

        const totalFound = Number(json?.totalFound ?? postings.length);
        offset += postings.length;
        if (postings.length === 0 || offset >= totalFound || offset >= 500) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return allPostings.map((job) => ({
        sourceId: this.metadata.id,
        externalJobId: String((job as { id?: string }).id),
        payload: job as Record<string, unknown>,
        fetchedAt: new Date(),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      IngestionLogger.error('Pipeline', `SmartRecruiters fetch failed for ${this.config.companyName}: ${message}`, this.metadata.id, err instanceof Error ? err.stack : undefined);
      return [];
    }
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const p = raw.payload as {
      id?: string;
      name?: string;
      ref?: string;
      releasedDate?: string;
      company?: { identifier?: string; name?: string };
      location?: {
        city?: string;
        region?: string;
        country?: string;
        remote?: boolean;
        hybrid?: boolean;
      };
      industry?: { label?: string };
      function?: { label?: string };
      typeOfEmployment?: { label?: string; id?: string };
    };

    const companyIdentifier = p.company?.identifier || this.config.boardToken;
    const postingId = String(p.id || raw.externalJobId);

    const city = p.location?.city || '';
    const region = p.location?.region || '';
    const countryRaw = p.location?.country || '';
    const country =
      countryRaw === 'in' || countryRaw.toLowerCase() === 'india'
        ? 'India'
        : countryRaw || '';
    const locationStr = [city, region, country].filter(Boolean).join(', ') || 'Remote';

    const empType = p.typeOfEmployment?.label || p.typeOfEmployment?.id || '';
    const description = `${p.name} position at ${this.config.companyName}. Industry: ${p.industry?.label || 'Technology'}. Function: ${p.function?.label || 'Engineering'}.`;
    const isInternship = isInternshipRole(p.name || '', empType, description);
    const regionTag = isIndiaLocation(locationStr) ? 'india' : 'global';

    const fallbackUrl = buildSmartRecruitersJobUrl(companyIdentifier, postingId);
    const resolvedUrl =
      (await fetchSmartRecruitersApplicationUrl(companyIdentifier, postingId)) || fallbackUrl;

    return {
      externalJobId: postingId,
      title: p.name || 'Software Engineering Intern',
      companyName: this.config.companyName,
      companyWebsite: this.config.websiteUrl || 'https://smartrecruiters.com',
      location: locationStr,
      remoteType: p.location?.remote ? 'REMOTE' : p.location?.hybrid ? 'HYBRID' : 'ONSITE',
      type: isInternship ? 'INTERNSHIP' : 'FULL_TIME',
      salaryRange: 'Competitive stipend',
      applicationUrl: resolvedUrl,
      deadline: p.releasedDate ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      description,
      requirements: 'Enrolled in an undergraduate or graduate program. Strong programming and problem-solving skills.',
      tags: ['smartrecruiters', this.config.boardToken.toLowerCase(), regionTag, isInternship ? 'internship' : 'job'],
    };
  }
}
