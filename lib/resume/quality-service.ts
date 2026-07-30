import { ParsedResumePayload } from './ai-parser-service';

export interface QualityFeedback {
  category: 'Completeness' | 'Formatting' | 'Skills' | 'Projects' | 'Education' | 'Contact';
  type: 'strength' | 'suggestion';
  message: string;
}

export interface QualityReport {
  overallScore: number;
  completenessScore: number;
  formattingScore: number;
  skillsScore: number;
  projectsScore: number;
  educationScore: number;
  contactScore: number;
  feedback: QualityFeedback[];
}

export class QualityService {
  static evaluate(payload: ParsedResumePayload): QualityReport {
    const feedback: QualityFeedback[] = [];

    // 1. Contact Score (max 100)
    let contactPoints = 0;
    if (payload.fullName) contactPoints += 25;
    if (payload.email) contactPoints += 30;
    if (payload.phone) contactPoints += 25;
    if (payload.location) contactPoints += 20;

    const contactScore = contactPoints;
    if (contactScore === 100) {
      feedback.push({ category: 'Contact', type: 'strength', message: 'All key contact channels (Email, Phone, Location) are listed.' });
    } else {
      if (!payload.email) feedback.push({ category: 'Contact', type: 'suggestion', message: 'Add a professional email address so recruiters can reach you.' });
      if (!payload.phone) feedback.push({ category: 'Contact', type: 'suggestion', message: 'Provide a phone number for direct scheduling/outreach.' });
      if (!payload.location) feedback.push({ category: 'Contact', type: 'suggestion', message: 'List your general location (e.g. San Francisco, CA) to confirm relocation requirements.' });
    }

    // 2. Education Presence (max 100)
    const educationScore = payload.education.length > 0 ? 100 : 0;
    if (educationScore === 100) {
      feedback.push({ category: 'Education', type: 'strength', message: `Listed academic credentials at ${payload.education.map(e => e.school).join(', ')}.` });
    } else {
      feedback.push({ category: 'Education', type: 'suggestion', message: 'No education entries detected. Add your university degree, major, and graduation targets.' });
    }

    // 3. Project Quality (max 100)
    let projectPoints = 0;
    if (payload.projects.length > 0) {
      projectPoints += 40; // listed projects
      const hasBullets = payload.projects.every(p => p.bullets.length > 0);
      const hasTech = payload.projects.every(p => p.technologies.length > 0);
      if (hasBullets) projectPoints += 30;
      if (hasTech) projectPoints += 30;
    }
    const projectsScore = projectPoints;
    if (projectsScore === 100) {
      feedback.push({ category: 'Projects', type: 'strength', message: 'Projects list is robust and clearly identifies target technologies and outcome bullets.' });
    } else if (payload.projects.length > 0) {
      if (!payload.projects.every(p => p.bullets.length > 0)) {
        feedback.push({ category: 'Projects', type: 'suggestion', message: 'Elaborate on your projects with clear bullet descriptions explaining what you built.' });
      }
      if (!payload.projects.every(p => p.technologies.length > 0)) {
        feedback.push({ category: 'Projects', type: 'suggestion', message: 'List specific framework tags (e.g. React, Docker) for each project.' });
      }
    } else {
      feedback.push({ category: 'Projects', type: 'suggestion', message: 'Add personal or open-source projects to showcase practical application of your skills.' });
    }

    // 4. Skills Coverage (max 100)
    let skillsPoints = 0;
    const totalSkills = (payload.skills?.length || 0) + (payload.technologies?.length || 0);
    if (totalSkills > 0) {
      skillsPoints += 40;
      if (totalSkills >= 5) skillsPoints += 30;
      if (totalSkills >= 10) skillsPoints += 30;
    }
    const skillsScore = skillsPoints;
    if (skillsScore === 100) {
      feedback.push({ category: 'Skills', type: 'strength', message: `Strong skills presence with ${totalSkills} tech stacks tagged.` });
    } else {
      feedback.push({ category: 'Skills', type: 'suggestion', message: 'Add more core technical skills and tools to maximize keyword matching in job searches.' });
    }

    // 5. Completeness Score (max 100)
    let completenessPoints = 0;
    if (payload.summary) completenessPoints += 20;
    if (payload.education.length > 0) completenessPoints += 20;
    if (payload.experience.length > 0) completenessPoints += 30;
    if (payload.skills.length > 0) completenessPoints += 20;
    if (payload.links.length > 0) completenessPoints += 10;
    
    const completenessScore = completenessPoints;
    if (payload.experience.length > 0) {
      feedback.push({ category: 'Completeness', type: 'strength', message: `Includes ${payload.experience.length} professional experience entries.` });
    } else {
      feedback.push({ category: 'Completeness', type: 'suggestion', message: 'Add structural job listings, internship logs, or volunteering summaries.' });
    }

    // 6. Formatting Score (max 100)
    let formattingPoints = 100;
    // Check if bullets have action verbs or if descriptions are too long/short
    if (payload.experience.some(ex => (ex.description?.length || 0) > 400)) {
      formattingPoints -= 20;
      feedback.push({ category: 'Formatting', type: 'suggestion', message: 'Some job descriptions are too wordy. Break descriptions into readable bullet lists.' });
    }
    const bulletsCount = payload.experience.flatMap(ex => ex.bullets).length;
    if (payload.experience.length > 0 && bulletsCount === 0) {
      formattingPoints -= 30;
      feedback.push({ category: 'Formatting', type: 'suggestion', message: 'Use action verb bullets (e.g. Developed, Optimized) to frame achievements.' });
    }
    const formattingScore = Math.max(formattingPoints, 20);
    if (formattingScore === 100) {
      feedback.push({ category: 'Formatting', type: 'strength', message: 'Visual structural density and bullets check out perfectly.' });
    }

    // Overall Score (Weighted Average)
    const overallScore = Math.round(
      (contactScore * 0.15) +
      (educationScore * 0.15) +
      (projectsScore * 0.20) +
      (skillsScore * 0.20) +
      (completenessScore * 0.20) +
      (formattingScore * 0.10)
    );

    return {
      overallScore,
      completenessScore,
      formattingScore,
      skillsScore,
      projectsScore,
      educationScore,
      contactScore,
      feedback,
    };
  }
}
