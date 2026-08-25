export type ApplicationStatus = 'discovered' | 'shortlisted' | 'preparing' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  activeOpeningsCount: number;
  isTracking: boolean;
  website: string;
}

export interface Internship {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
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
