import { OpportunityType, RemoteType } from '../generated/prisma/enums';
import { ParsedOpportunity, NormalizedOpportunity } from './types';
import { resolveOpportunityDeadline } from '../opportunities/deadline-utils';

export class Normalizer {
  static normalize(parsed: ParsedOpportunity): NormalizedOpportunity {
    const title = parsed.title.trim();
    const companyName = this.normalizeCompanyName(parsed.companyName);
    const location = this.normalizeLocation(parsed.location);
    const remoteType = this.normalizeRemoteType(parsed.remoteType, parsed.location);
    const type = this.normalizeEmploymentType(parsed.type, title);
    const salaryRange = this.normalizeSalaryRange(parsed.salaryRange);
    const applicationUrl = this.normalizeUrl(parsed.applicationUrl);
    const deadline =
      resolveOpportunityDeadline({
        explicit: parsed.deadline,
        description: parsed.description,
      }) ?? null;
    
    // Normalize skills and tags
    const { tags, skills } = this.extractTagsAndSkills(
      parsed.tags || [],
      parsed.skills || [],
      title,
      parsed.description || ''
    );

    return {
      externalJobId: parsed.externalJobId.trim(),
      title,
      companyName,
      companyWebsite: parsed.companyWebsite ? this.normalizeUrl(parsed.companyWebsite) : null,
      companyLinkedin: parsed.companyLinkedin ? this.normalizeUrl(parsed.companyLinkedin) : null,
      location,
      remoteType,
      type,
      salaryRange,
      applicationUrl,
      deadline,
      description: parsed.description?.trim() || null,
      requirements: parsed.requirements?.trim() || null,
      tags,
      skills,
    };
  }

  static normalizeCompanyName(name: string): string {
    if (!name) return 'Unknown Company';
    // Remove common business entity suffixes
    return name
      .replace(/[,.]?\s+(Inc|LLC|Ltd|Corp|Corporation|L\.P\.|Co|Group|Technologies|Systems)\.?$/i, '')
      .trim();
  }

  static normalizeLocation(loc?: string): string {
    if (!loc || loc.trim() === '') return 'United States';
    const trimmed = loc.trim();
    // Capitalize properly
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  static normalizeRemoteType(remote?: string, location?: string): RemoteType {
    const text = `${remote || ''} ${location || ''}`.toLowerCase();
    
    if (text.includes('remote') || text.includes('wfh') || text.includes('work from home')) {
      return RemoteType.REMOTE;
    }
    if (text.includes('hybrid') || text.includes('flexible') || text.includes('flex')) {
      return RemoteType.HYBRID;
    }
    return RemoteType.ONSITE;
  }

  static normalizeEmploymentType(type?: string, title?: string): OpportunityType {
    const text = `${type || ''} ${title || ''}`.toLowerCase();

    if (text.includes('new grad') || text.includes('newgrad') || text.includes('entry level') || text.includes('entrylevel')) {
      return OpportunityType.NEW_GRAD;
    }
    if (text.includes('scholarship')) {
      return OpportunityType.SCHOLARSHIP;
    }
    if (text.includes('fellowship') || text.includes('fellow')) {
      return OpportunityType.FELLOWSHIP;
    }
    if (text.includes('hackathon')) {
      return OpportunityType.HACKATHON;
    }
    if (text.includes('research') || text.includes('lab') || text.includes('phd')) {
      return OpportunityType.RESEARCH;
    }
    // Default to internship as it is the core focus of InternScope AI
    return OpportunityType.INTERNSHIP;
  }

  static normalizeSalaryRange(salary?: string): string | null {
    if (!salary || salary.trim() === '') return null;
    return salary.trim();
  }

  static normalizeUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  static normalizeDate(date?: string | Date): Date | null {
    if (!date) return null;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  static extractTagsAndSkills(
    inputTags: string[],
    inputSkills: string[],
    title: string,
    description: string
  ): { tags: string[]; skills: string[] } {
    const content = `${title} ${description}`.toLowerCase();
    
    // Tech dictionary mapping
    const skillList = [
      'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Prisma', 'PostgreSQL', 
      'Tailwind', 'Next.js', 'Rust', 'Ruby', 'C++', 'Swift', 'Kotlin', 'Docker', 'AWS'
    ];

    const foundSkills = new Set<string>();

    // Input matching
    inputSkills.forEach(s => {
      const match = skillList.find(tech => tech.toLowerCase() === s.trim().toLowerCase());
      if (match) foundSkills.add(match);
    });

    skillList.forEach(tech => {
      // Regex check for whole word match
      const regex = new RegExp(`\\b${tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(content)) {
        foundSkills.add(tech);
      }
    });

    const finalSkills = Array.from(foundSkills);
    const finalTags = Array.from(new Set([...inputTags.map(t => t.trim().toLowerCase()), ...finalSkills.map(s => s.toLowerCase())]));

    return {
      tags: finalTags,
      skills: finalSkills,
    };
  }
}
