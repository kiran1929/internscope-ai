export interface ScraperProviderConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
  boardToken: string;
  companyName?: string;
  websiteUrl?: string;
  careerPageUrl?: string;
  rateLimitMs: number;
}

export interface ScraperSettings {
  greenhouse: ScraperProviderConfig;
  lever: ScraperProviderConfig;
  ashby: ScraperProviderConfig;
}

export const defaultScraperSettings: ScraperSettings = {
  greenhouse: {
    enabled: true,
    baseUrl: 'https://boards-api.greenhouse.io/v1/boards',
    timeout: 25000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'InternScope-Ingestion-Engine/1.0',
    },
    boardToken: 'stripe',
    rateLimitMs: 1000,
  },
  lever: {
    enabled: true,
    baseUrl: 'https://api.lever.co/v0/postings',
    timeout: 25000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'InternScope-Ingestion-Engine/1.0',
    },
    boardToken: 'spotify',
    rateLimitMs: 1000,
  },
  ashby: {
    enabled: true,
    baseUrl: 'https://api.ashbyhq.com/posting-api/job-board',
    timeout: 25000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'InternScope-Ingestion-Engine/1.0',
    },
    boardToken: 'linear',
    rateLimitMs: 1000,
  },
};
