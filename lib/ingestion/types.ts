import { OpportunityType, RemoteType } from '../generated/prisma/enums';

export interface ScrapeSourceMetadata {
  id: string;
  name: string;
  type: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'workday' | 'jobvetta' | 'unstop' | 'devfolio' | 'indian-tech' | 'rss' | 'api' | 'custom';
  enabled: boolean;
  url?: string;
}

export interface RawOpportunity {
  sourceId: string;
  externalJobId: string;
  payload: Record<string, unknown>;
  fetchedAt: Date;
}

export interface ParsedOpportunity {
  externalJobId: string;
  title: string;
  companyName: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  location: string;
  remoteType?: string;
  type?: string;
  salaryRange?: string;
  applicationUrl: string;
  description?: string;
  requirements?: string;
  deadline?: string | Date;
  tags?: string[];
  skills?: string[];
}

export interface NormalizedOpportunity {
  externalJobId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyLinkedin: string | null;
  location: string;
  remoteType: RemoteType;
  type: OpportunityType;
  salaryRange: string | null;
  applicationUrl: string;
  deadline: Date | null;
  description: string | null;
  requirements: string | null;
  tags: string[];
  skills: string[];
}

export interface CompanyMatchResult {
  companyId: string | null;
  confidence: number; // 0.0 to 1.0
  matchType: 'website' | 'linkedin' | 'careerPage' | 'name' | 'none';
  message: string;
}

export interface DuplicateDetectResult {
  isDuplicate: boolean;
  confidence: number; // 0.0 to 1.0
  existingOpportunityId: string | null;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OpportunityIngestionRecord {
  raw: RawOpportunity;
  parsed: ParsedOpportunity | null;
  normalized: NormalizedOpportunity | null;
  match: CompanyMatchResult | null;
  duplicate: DuplicateDetectResult | null;
  validation: ValidationResult | null;
  status: 'success' | 'failed' | 'skipped' | 'duplicate';
  errors: string[];
}

export interface IngestionSummary {
  sourceId: string;
  startTime: Date;
  endTime: Date;
  totalFetched: number;
  totalParsed: number;
  totalNormalized: number;
  totalMatched: number;
  totalValidated: number;
  totalDuplicates: number;
  totalPersisted: number;
  totalFailed: number;
  records: OpportunityIngestionRecord[];
}
