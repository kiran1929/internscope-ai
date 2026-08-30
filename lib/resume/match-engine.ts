import { ParsedResumePayload } from './ai-parser-service';
import { capitalizeSkill, findMatchingSkill, toCanonicalSkill } from './skill-normalizer';

export interface MatchResults {
  overallScore: number;
  skillScore: number;
  techScore: number;
  experienceScore: number;
  locationScore: number;
  employmentTypeScore: number;
  missingSkills: string[];
  missingTechnologies: string[];
  niceToHaveSkills: string[];
  strengthAreas: string[];
  improvementSuggestions: string[];
  matchExplanation: string;
}

export class MatchEngine {
  static match(
    resume: ParsedResumePayload,
    job: {
      title: string;
      location: string;
      remoteType: string;
      type: string;
      enrichment: {
        skills: string[];
        techStack: any;
        experienceLevel: string | null;
        employmentType: string | null;
      } | null;
    }
  ): MatchResults {
    const resumeSkills = (resume.skills || []);
    const resumeTechs = (resume.technologies || []);

    const jobSkills = (job.enrichment?.skills || []);

    const jobTechs: string[] = [];
    if (job.enrichment?.techStack && typeof job.enrichment.techStack === 'object') {
      Object.values(job.enrichment.techStack).forEach((val) => {
        if (Array.isArray(val)) {
          val.forEach((v) => jobTechs.push(String(v)));
        }
      });
    }

    // 1. Skill Match Score (0 to 100) — fuzzy via canonical normalization
    let skillScore = 100;
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    if (jobSkills.length > 0) {
      jobSkills.forEach((s) => {
        if (findMatchingSkill(resumeSkills, s)) {
          matchingSkills.push(s);
        } else {
          missingSkills.push(s);
        }
      });
      skillScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
    }

    // 2. Technology Match Score (0 to 100)
    let techScore = 100;
    const matchingTechs: string[] = [];
    const missingTechnologies: string[] = [];

    if (jobTechs.length > 0) {
      jobTechs.forEach((t) => {
        if (findMatchingSkill(resumeTechs, t) || findMatchingSkill(resumeSkills, t)) {
          matchingTechs.push(t);
        } else {
          missingTechnologies.push(t);
        }
      });
      techScore = Math.round((matchingTechs.length / jobTechs.length) * 100);
    }

    // 3. Experience Match Score (0 to 100)
    let experienceScore = 70;
    const jobExp = job.enrichment?.experienceLevel || 'Entry Level';
    const resumeExp = resume.experienceLevel || 'Entry Level';

    const levelsOrder = ['Intern', 'Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Manager'];
    const jobIdx = levelsOrder.indexOf(jobExp);
    const resumeIdx = levelsOrder.indexOf(resumeExp);

    if (jobIdx === -1 || resumeIdx === -1) {
      experienceScore = 80;
    } else if (resumeIdx >= jobIdx) {
      experienceScore = 100;
    } else {
      const diff = jobIdx - resumeIdx;
      experienceScore = Math.max(100 - (diff * 20), 40);
    }

    // 4. Location Match Score (0 to 100)
    let locationScore = 50;
    const jobLocation = job.location.toLowerCase();
    const resumeLocation = (resume.location || '').toLowerCase();
    const isJobRemote = job.remoteType.toLowerCase() === 'remote' || jobLocation.includes('remote');

    if (isJobRemote) {
      locationScore = 100;
    } else if (resumeLocation && (jobLocation.includes(resumeLocation) || resumeLocation.includes(jobLocation))) {
      locationScore = 100;
    } else if (resumeLocation) {
      const stateMatch = resumeLocation.split(',')[1]?.trim();
      if (stateMatch && jobLocation.includes(stateMatch)) {
        locationScore = 85;
      } else {
        locationScore = 50;
      }
    }

    // 5. Employment Type Match Score (0 to 100)
    let employmentTypeScore = 80;
    const jobType = job.type.toLowerCase();

    if (jobType === 'internship' && resumeExp === 'Intern') {
      employmentTypeScore = 100;
    } else if (jobType === 'new_grad' || jobType === 'full_time') {
      employmentTypeScore = resumeExp !== 'Intern' ? 100 : 60;
    }

    const overallScore = Math.round(
      (skillScore * 0.35) +
      (techScore * 0.25) +
      (experienceScore * 0.20) +
      (locationScore * 0.10) +
      (employmentTypeScore * 0.10)
    );

    const jobSkillCanonical = new Set(jobSkills.map((s) => toCanonicalSkill(s)));
    const niceToHaveSkills = resumeSkills
      .filter((s) => !jobSkillCanonical.has(toCanonicalSkill(s)))
      .slice(0, 3);

    const strengthAreas: string[] = [];
    const improvementSuggestions: string[] = [];

    if (skillScore >= 80) strengthAreas.push('Strong Core Skills alignment.');
    if (techScore >= 80) strengthAreas.push('Excellent Technology stack match.');
    if (experienceScore === 100) strengthAreas.push('Meets or exceeds required seniority/experience level.');
    if (locationScore === 100) strengthAreas.push('Location matches perfectly (or role is remote).');

    if (missingSkills.length > 0) {
      improvementSuggestions.push(`Incorporate skills: ${missingSkills.slice(0, 3).map((s) => capitalizeSkill(s)).join(', ')} into your resume summary or description.`);
    }
    if (missingTechnologies.length > 0) {
      improvementSuggestions.push(`Highlight any projects or courseworks using: ${missingTechnologies.slice(0, 3).map((t) => capitalizeSkill(t)).join(', ')}.`);
    }
    if (experienceScore < 80) {
      improvementSuggestions.push('Add bullet points detailing leadership roles or project ownership to match required experience.');
    }

    let matchExplanation = `This position matches your profile at ${overallScore}%. `;
    if (isJobRemote) {
      matchExplanation += `The role is Remote, removing geographical constraints. `;
    }
    if (matchingSkills.length > 0) {
      matchExplanation += `You possess core requirements like ${matchingSkills.slice(0, 3).map((s) => capitalizeSkill(s)).join(', ')}. `;
    }
    if (missingSkills.length > 0) {
      matchExplanation += `However, you are missing skills such as ${missingSkills.slice(0, 2).map((s) => capitalizeSkill(s)).join(', ')}. `;
    }

    return {
      overallScore,
      skillScore,
      techScore,
      experienceScore,
      locationScore,
      employmentTypeScore,
      missingSkills: missingSkills.map((s) => capitalizeSkill(s)),
      missingTechnologies: missingTechnologies.map((t) => capitalizeSkill(t)),
      niceToHaveSkills: niceToHaveSkills.map((s) => capitalizeSkill(s)),
      strengthAreas,
      improvementSuggestions,
      matchExplanation,
    };
  }
}
