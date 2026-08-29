import type { Opportunity, Company, OpportunityEnrichment, Profile } from '../generated/prisma/client';

export type MatchableOpportunity = Pick<
  Opportunity,
  'id' | 'title' | 'location' | 'type' | 'remoteType' | 'companyId'
> & {
  company: Pick<Company, 'name'>;
  enrichment: Pick<
    OpportunityEnrichment,
    'skills' | 'experienceLevel' | 'salaryMin' | 'salaryMax' | 'salaryCurrency'
  > | null;
};

export interface UserMatchInput {
  profile: Pick<
    Profile,
    | 'skills'
    | 'preferredLocations'
    | 'employmentPreferences'
    | 'remotePreferences'
  > | null;
  tracksCompany?: boolean;
}

export interface OpportunityMatchResult {
  score: number;
  matchedSkills: string[];
  matchReasons: string[];
}

export function scoreUserAgainstOpportunity(
  user: UserMatchInput,
  opportunity: MatchableOpportunity,
): OpportunityMatchResult {
  const profile = user.profile;
  const matchReasons: string[] = [];
  let score = 0;

  const userSkills = profile?.skills || [];
  const jobSkills = opportunity.enrichment?.skills || [];
  const matchedSkills = jobSkills.filter((skill) =>
    userSkills.some((us) => us.toLowerCase() === skill.toLowerCase()),
  );

  if (userSkills.length > 0 && jobSkills.length > 0) {
    score += (matchedSkills.length / Math.max(userSkills.length, 1)) * 50;
    if (matchedSkills.length > 0) {
      matchReasons.push(
        `Matches your profile skills in ${matchedSkills.slice(0, 3).join(', ')}`,
      );
    }
  } else if (jobSkills.length > 0) {
    score += 35;
    matchReasons.push(`Role aligns with in-demand skills: ${jobSkills.slice(0, 3).join(', ')}`);
  } else {
    score += 25;
    matchReasons.push('New opportunity posted on InternScope AI');
  }

  const userLocations = profile?.preferredLocations || [];
  if (userLocations.length > 0) {
    const jobLoc = opportunity.location.toLowerCase();
    if (userLocations.some((loc) => jobLoc.includes(loc.toLowerCase()))) {
      score += 20;
      matchReasons.push(`Matches your preferred location (${opportunity.location})`);
    }
  }

  const userRemote = profile?.remotePreferences || [];
  if (userRemote.length > 0 && opportunity.remoteType) {
    const jobRemote = opportunity.remoteType.toString().toUpperCase();
    if (userRemote.some((pref) => pref.toUpperCase() === jobRemote)) {
      score += 15;
      matchReasons.push(`Matches your preferred ${jobRemote.toLowerCase()} work mode`);
    }
  }

  const userTypes = profile?.employmentPreferences || [];
  if (userTypes.length > 0 && opportunity.type) {
    const jobType = opportunity.type.toString().toUpperCase();
    if (userTypes.some((pref) => pref.toUpperCase() === jobType)) {
      score += 15;
      matchReasons.push(`Matches your preferred ${jobType.toLowerCase().replace('_', ' ')} roles`);
    }
  }

  if (user.tracksCompany) {
    score += 20;
    matchReasons.push(`Posted by ${opportunity.company.name}, one of your target companies`);
  }

  score = Math.min(100, Math.round(score));

  if (matchReasons.length === 0) {
    matchReasons.push(`New opening at ${opportunity.company.name} may fit your career goals`);
  }

  return {
    score,
    matchedSkills: matchedSkills.length > 0 ? matchedSkills.slice(0, 6) : jobSkills.slice(0, 4),
    matchReasons: matchReasons.slice(0, 4),
  };
}
