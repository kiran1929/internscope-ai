import { Connector } from '../connector';
import { RawOpportunity, ParsedOpportunity, ScrapeSourceMetadata } from '../types';
import { IngestionLogger } from '../logger';
import { isInternshipRole } from '../internship-filter';

const BASE_URL = 'https://api.jobvetta.com/v1';

/** Free tier is 50 req/day; leave headroom for other tools/MCP. */
const DEFAULT_MAX_REQUESTS = 40;

export interface JobVettaSearchHit {
  job_id: string;
  title: string;
  company: string;
  location: string;
  work_model?: string | null;
  employment_type?: string | null;
  salary?: unknown;
  url: string;
}

export interface JobVettaJobDetail extends JobVettaSearchHit {
  normalized_title?: string | null;
  description?: string | null;
  experience_level?: string | null;
  minimum_qualifications?: string[] | null;
  preferred_qualifications?: string[] | null;
  skills_required?: string[] | null;
  responsibilities?: string[] | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  benefits?: string[] | null;
  created_at?: number | null;
  last_seen_date?: number | null;
}

type JobVettaRawPayload = {
  summary: JobVettaSearchHit;
  detail?: JobVettaJobDetail | null;
};

interface SearchQuery {
  q: string;
  location?: string;
  days?: number;
  limit?: number;
}

/**
 * Intern-focused searches. Each call returns ≤10 jobs (API hard limit).
 * City queries catch listings missed by broad keyword search.
 */
const INTERN_SEARCHES: SearchQuery[] = [
  { q: 'internship', days: 90, limit: 10 },
  { q: 'intern', days: 60, limit: 10 },
  { q: 'software engineering intern', days: 120, limit: 10 },
  { q: 'software intern', days: 120, limit: 10 },
  { q: 'summer analyst', days: 120, limit: 10 },
  { q: 'graduate trainee', days: 90, limit: 10 },
  { q: 'trainee', days: 60, limit: 10 },
  { q: 'co-op', days: 90, limit: 10 },
  { q: 'apprentice', days: 90, limit: 10 },
  { q: 'intern', location: 'Bengaluru', days: 60, limit: 10 },
  { q: 'intern', location: 'Bangalore', days: 60, limit: 10 },
  { q: 'intern', location: 'Hyderabad', days: 60, limit: 10 },
  { q: 'intern', location: 'Pune', days: 60, limit: 10 },
  { q: 'intern', location: 'Mumbai', days: 60, limit: 10 },
  { q: 'intern', location: 'Delhi', days: 60, limit: 10 },
  { q: 'intern', location: 'Noida', days: 60, limit: 10 },
  { q: 'intern', location: 'Gurugram', days: 60, limit: 10 },
  { q: 'intern', location: 'Chennai', days: 60, limit: 10 },
];

function getApiKey(): string | null {
  const key = process.env.JOBVETTA_API_KEY?.trim();
  return key || null;
}

function getMaxRequests(): number {
  const raw = Number(process.env.JOBVETTA_MAX_REQUESTS || DEFAULT_MAX_REQUESTS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_REQUESTS;
  return Math.min(50, Math.floor(raw));
}

function looksLikeInternship(hit: JobVettaSearchHit): boolean {
  return isInternshipRole(
    hit.title || '',
    hit.employment_type || '',
    `${hit.title} ${hit.employment_type || ''}`
  );
}

function formatSalary(detail?: JobVettaJobDetail | null, summarySalary?: unknown): string | undefined {
  if (detail?.salary_min != null || detail?.salary_max != null) {
    const currency = detail.salary_currency || 'INR';
    const min = detail.salary_min != null ? `${detail.salary_min}` : '';
    const max = detail.salary_max != null ? `${detail.salary_max}` : '';
    if (min && max) return `${currency} ${min}–${max}`;
    if (min) return `${currency} ${min}+`;
    if (max) return `Up to ${currency} ${max}`;
  }
  if (typeof summarySalary === 'string' && summarySalary.trim()) return summarySalary.trim();
  return undefined;
}

export class JobVettaConnector implements Connector {
  public metadata: ScrapeSourceMetadata;
  private requestCount = 0;
  private maxRequests: number;

  constructor() {
    this.maxRequests = getMaxRequests();
    this.metadata = {
      id: 'jobvetta_india',
      name: 'JobVetta (India Internships)',
      type: 'jobvetta',
      enabled: Boolean(getApiKey()),
      url: `${BASE_URL}/jobs`,
    };
  }

  isConfigured(): boolean {
    return Boolean(getApiKey());
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  private async apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('JOBVETTA_API_KEY is not set');
    }
    if (this.requestCount >= this.maxRequests) {
      throw new Error(`JobVetta request budget exhausted (${this.maxRequests})`);
    }

    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) url.searchParams.set(key, value);
      }
    }

    this.requestCount += 1;
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'InternScope-Ingestion-Engine/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 401) {
      throw new Error('JobVetta API key is invalid (401)');
    }
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 'unknown';
      throw new Error(`JobVetta daily rate limit reached (429). Retry-After: ${retryAfter}`);
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`JobVetta API error ${response.status}: ${body.slice(0, 200)}`);
    }

    return (await response.json()) as T;
  }

  async fetchRaw(): Promise<RawOpportunity[]> {
    if (!this.isConfigured()) {
      IngestionLogger.warn(
        'Pipeline',
        'JobVetta skipped — set JOBVETTA_API_KEY to enable',
        this.metadata.id
      );
      return [];
    }

    IngestionLogger.info(
      'Pipeline',
      `Fetching JobVetta India internships (budget ${this.maxRequests} requests)...`,
      this.metadata.id
    );

    const byId = new Map<string, JobVettaSearchHit>();
    let searchEstimateTotal = 0;

    for (const query of INTERN_SEARCHES) {
      if (this.requestCount >= this.maxRequests) break;

      try {
        const params: Record<string, string> = {
          q: query.q,
          limit: String(Math.min(10, query.limit ?? 10)),
        };
        if (query.location) params.location = query.location;
        if (query.days) params.days = String(query.days);

        const result = await this.apiGet<{ total?: number; jobs?: JobVettaSearchHit[] }>(
          '/jobs',
          params
        );

        const jobs = Array.isArray(result.jobs) ? result.jobs : [];
        if (typeof result.total === 'number') {
          searchEstimateTotal = Math.max(searchEstimateTotal, result.total);
        }

        for (const job of jobs) {
          if (!job?.job_id || !job.title) continue;
          if (!looksLikeInternship(job)) continue;
          if (!byId.has(job.job_id)) {
            byId.set(job.job_id, job);
          }
        }

        IngestionLogger.info(
          'Pipeline',
          `JobVetta search q="${query.q}"${query.location ? ` loc=${query.location}` : ''}: ${jobs.length} returned, ${byId.size} unique internships so far (est. total=${result.total ?? '?'})`,
          this.metadata.id
        );

        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        IngestionLogger.warn('Pipeline', `JobVetta search aborted: ${message}`, this.metadata.id);
        break;
      }
    }

    const candidates = Array.from(byId.values());
    IngestionLogger.info(
      'Pipeline',
      `JobVetta unique internship candidates: ${candidates.length} (max search estimate seen: ${searchEstimateTotal}). Fetching details with remaining budget...`,
      this.metadata.id
    );

    const fetchDetails = process.env.JOBVETTA_FETCH_DETAILS !== 'false';
    const enriched: Array<{ summary: JobVettaSearchHit; detail: JobVettaJobDetail | null }> = [];

    for (const summary of candidates) {
      let detail: JobVettaJobDetail | null = null;
      if (fetchDetails && this.requestCount < this.maxRequests) {
        try {
          detail = await this.apiGet<JobVettaJobDetail>(
            `/jobs/${encodeURIComponent(summary.job_id)}`
          );
          await new Promise((r) => setTimeout(r, 200));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          IngestionLogger.warn(
            'Pipeline',
            `JobVetta detail fetch failed for ${summary.job_id}: ${message}`,
            this.metadata.id
          );
          if (message.includes('429') || message.includes('budget')) {
            // Keep remaining summaries without details
            enriched.push({ summary, detail: null });
            continue;
          }
        }
      }
      enriched.push({ summary, detail });
    }

    // If we ran out mid-detail, still include remaining summaries
    const enrichedIds = new Set(enriched.map((e) => e.summary.job_id));
    for (const summary of candidates) {
      if (!enrichedIds.has(summary.job_id)) {
        enriched.push({ summary, detail: null });
      }
    }

    IngestionLogger.info(
      'Pipeline',
      `JobVetta fetch complete: ${enriched.length} internships, ${this.requestCount}/${this.maxRequests} API requests used`,
      this.metadata.id
    );

    return enriched.map(({ summary, detail }) => ({
      sourceId: this.metadata.id,
      externalJobId: summary.job_id,
      payload: { summary, detail } satisfies JobVettaRawPayload as unknown as Record<string, unknown>,
      fetchedAt: new Date(),
    }));
  }

  async parse(raw: RawOpportunity): Promise<ParsedOpportunity> {
    const payload = raw.payload as unknown as JobVettaRawPayload;
    const summary = payload.summary;
    const detail = payload.detail;

    const title = detail?.title || summary.title || 'Internship';
    const companyName = detail?.company || summary.company || 'Unknown Company';
    const location = detail?.location || summary.location || 'India';
    const employmentType = detail?.employment_type || summary.employment_type || '';
    const workModel = detail?.work_model || summary.work_model || '';

    const descriptionParts = [
      detail?.description?.trim() || '',
      detail?.responsibilities?.length
        ? `Responsibilities:\n- ${detail.responsibilities.join('\n- ')}`
        : '',
    ].filter(Boolean);
    const description =
      descriptionParts.join('\n\n') ||
      `${title} at ${companyName} (${location}). Sourced via JobVetta India job index.`;

    const requirementsParts = [
      detail?.minimum_qualifications?.length
        ? detail.minimum_qualifications.join('\n')
        : '',
      detail?.preferred_qualifications?.length
        ? `Preferred:\n${detail.preferred_qualifications.join('\n')}`
        : '',
      detail?.skills_required?.length ? `Skills: ${detail.skills_required.join(', ')}` : '',
    ].filter(Boolean);

    const applicationUrl =
      detail?.url ||
      summary.url ||
      `https://www.jobvetta.com/jobs/${encodeURIComponent(summary.job_id || raw.externalJobId)}`;

    const createdAtSec = detail?.created_at;
    const deadline =
      typeof createdAtSec === 'number' && createdAtSec > 0
        ? new Date(createdAtSec * 1000 + 45 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

    const isInternship = isInternshipRole(title, employmentType, description);

    return {
      externalJobId: summary.job_id || raw.externalJobId,
      title,
      companyName,
      companyWebsite: 'https://www.jobvetta.com',
      location,
      remoteType: /remote/i.test(workModel || '')
        ? 'REMOTE'
        : /hybrid/i.test(workModel || '')
          ? 'HYBRID'
          : 'ONSITE',
      type: isInternship ? 'INTERNSHIP' : employmentType || 'FULL_TIME',
      salaryRange: formatSalary(detail, summary.salary),
      applicationUrl,
      deadline,
      description,
      requirements: requirementsParts.join('\n\n') || undefined,
      tags: [
        'jobvetta',
        'india',
        isInternship ? 'internship' : 'job',
        ...(detail?.skills_required || []).slice(0, 8).map((s) => s.toLowerCase()),
      ],
      skills: detail?.skills_required || undefined,
    };
  }
}
