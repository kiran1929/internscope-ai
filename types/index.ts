export type ApplicationStatus = 'discovered' | 'shortlisted' | 'preparing' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface CompanyOpportunity {
  id: string;
  title: string;
  type: string;
  location?: string | null;
  remoteType?: string | null;
  deadline?: string | null;
  applicationUrl?: string | null;
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  logoUrl?: string | null;
  industry: string;
  activeOpeningsCount: number;
  isTracking: boolean;
  website: string;
  careerPage?: string;
  country?: string;
  hiringStatus?: string;
  companySize?: string;
  opportunities?: CompanyOpportunity[];
}

export interface Internship {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyWebsite?: string;
  role: string;
  location: string;
  status: 'open' | 'closed';
  deadline: string;
  matchScore: number;
  tags: string[];
  description: string;
  url: string;
}

export interface Application {
  id: string;
  internshipId: string;
  companyName: string;
  companyLogo: string;
  companyWebsite?: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  nextStep?: string;
}

export interface Activity {
  id: string;
  type: 'deadline' | 'applied' | 'interview' | 'match' | 'system';
  message: string;
  timestamp: string;
  internshipId?: string;
}

export interface EmailReportPreference {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'instant';
  isActive: boolean;
  categories: string[];
}
