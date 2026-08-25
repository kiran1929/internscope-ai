import {
  CandidateResumeProfile,
  JobInterviewProfile,
  CandidateInterviewMemory,
  InterviewDifficulty,
  QuestionIntent,
  CompactAnswerSummary,
  LongitudinalSkillRecord,
} from './llm/types';

export interface PlannedQuestionPlan {
  skill: string;
  topic: string;
  difficulty: InterviewDifficulty;
  intent: QuestionIntent;
  reason: string;
}

export class InterviewPlanner {
  /**
   * Deterministic decision engine deciding WHAT to test, WHY, at what DIFFICULTY, and with what INTENT.
   */
  static planNextQuestion(params: {
    candidateProfile: CandidateResumeProfile;
    jobProfile?: JobInterviewProfile;
    candidateMemory: CandidateInterviewMemory;
    longitudinalSkills?: LongitudinalSkillRecord[];
    sessionDifficulty: string;
    questionIndex: number;
    totalSessionQuestions: number;
    categories: string[];
    previousEvaluation?: CompactAnswerSummary;
    testedSkillsInSession?: string[];
  }): PlannedQuestionPlan {
    const {
      candidateProfile,
      jobProfile,
      candidateMemory,
      longitudinalSkills = [],
      sessionDifficulty,
      questionIndex,
      categories = [],
      previousEvaluation,
      testedSkillsInSession = [],
    } = params;

    // 1. Determine Difficulty adaptively
    let difficulty: InterviewDifficulty = (sessionDifficulty as InterviewDifficulty) || 'Medium';

    if (previousEvaluation) {
      if (previousEvaluation.score >= 80) {
        if (difficulty === 'Easy') difficulty = 'Medium';
        else if (difficulty === 'Medium') difficulty = 'Hard';
        else if (difficulty === 'Hard') difficulty = 'Very Hard';
      } else if (previousEvaluation.score < 50) {
        if (difficulty === 'Very Hard') difficulty = 'Hard';
        else if (difficulty === 'Hard') difficulty = 'Medium';
        else if (difficulty === 'Medium') difficulty = 'Easy';
      }
    }

    // Normalized tested set containing skills, topics, categories, and project names
    const testedSet = new Set(testedSkillsInSession.map((s) => s.toLowerCase().trim()));

    // Helper to check if a category is requested (or default to all if empty)
    const wantsCat = (cat: string) => categories.length === 0 || categories.some(c => c.toLowerCase().includes(cat.toLowerCase()));

    // Stage 1: Question 0 (Opening) -> Candidate's primary Resume Project Deep Dive
    if (questionIndex === 0 && wantsCat('Project') || wantsCat('Resume')) {
      const firstProject = candidateProfile.projects[0];
      if (firstProject && !testedSet.has(firstProject.name.toLowerCase())) {
        const topTech = firstProject.technologies[0] || 'System Architecture';
        return {
          skill: topTech,
          topic: `${firstProject.name} Architecture & Implementation`,
          difficulty,
          intent: 'project_deep_dive',
          reason: `Verifying candidate's core architecture claims on project "${firstProject.name}".`,
        };
      }
    }

    // Stage 2: Question 1 -> Core Technical Skill Assessment from Resume or Job Target
    if (questionIndex === 1 && (wantsCat('Technical') || wantsCat('Problem'))) {
      if (jobProfile && jobProfile.coreSkills.length > 0) {
        const untestedJobSkill = jobProfile.coreSkills.find((s) => !testedSet.has(s.toLowerCase()));
        if (untestedJobSkill) {
          return {
            skill: untestedJobSkill,
            topic: `${untestedJobSkill} Performance & Scale`,
            difficulty,
            intent: 'job_requirement',
            reason: `Targeting core job requirement ${untestedJobSkill} for ${jobProfile.role}.`,
          };
        }
      }

      // Check candidate's top resume skills
      const untestedSkill = candidateProfile.skills.find((s) => !testedSet.has(s.toLowerCase()));
      if (untestedSkill) {
        return {
          skill: untestedSkill,
          topic: `${untestedSkill} Internal Mechanisms & Best Practices`,
          difficulty,
          intent: 'skill_assessment',
          reason: `Assessing technical depth in primary resume skill ${untestedSkill}.`,
        };
      }
    }

    // Stage 3: Question 2 -> Real-world Scenario / Work Experience / Second Project Deep Dive
    if (questionIndex === 2) {
      // If candidate has work experience or a second project
      const secondProject = candidateProfile.projects[1];
      if (secondProject && !testedSet.has(secondProject.name.toLowerCase()) && (wantsCat('Project') || wantsCat('Resume'))) {
        const tech = secondProject.technologies[0] || 'Full Stack';
        return {
          skill: tech,
          topic: `${secondProject.name} Engineering Challenges`,
          difficulty,
          intent: 'project_deep_dive',
          reason: `Probing second resume project "${secondProject.name}".`,
        };
      }

      const experience = candidateProfile.experience[0];
      const companyName = experience?.company || 'Prior Experience';
      if (experience && !testedSet.has(companyName.toLowerCase()) && wantsCat('Technical')) {
        const tech = experience.technologies[0] || candidateProfile.skills[1] || 'Backend Systems';
        return {
          skill: tech,
          topic: `Production Debugging & Reliability at ${companyName}`,
          difficulty,
          intent: 'debugging',
          reason: `Evaluating real-world experience at ${companyName}.`,
        };
      }
    }

    // Stage 4: Question 3 -> Behavioral STAR Question
    if (questionIndex === 3 && wantsCat('Behavioral')) {
      return {
        skill: 'Engineering Leadership & STAR Communication',
        topic: 'Resolving Technical Disagreements & Production Incidents',
        difficulty,
        intent: 'behavioral',
        reason: 'Assessing communication, ownership, and STAR story structuring under pressure.',
      };
    }

    // Adaptive Check: If candidate scored low (<70) on a previous question with a missing concept, and we haven't probed it yet
    if (previousEvaluation && previousEvaluation.score < 70 && previousEvaluation.missingConcept) {
      const missingKey = previousEvaluation.missingConcept.toLowerCase().trim();
      if (!testedSet.has(missingKey) && !testedSet.has(`probe-${missingKey}`)) {
        return {
          skill: previousEvaluation.topic,
          topic: previousEvaluation.missingConcept,
          difficulty,
          intent: 'weakness_probe',
          reason: `Previous answer scored ${previousEvaluation.score}% and missed ${previousEvaluation.missingConcept}. Probing missing concept.`,
        };
      }
    }

    // Stage 5: Subsequent Questions -> Cycle through remaining untested resume skills or projects
    const nextProject = candidateProfile.projects.find(
      (p) => !testedSet.has(p.name.toLowerCase()) && !candidateMemory.projectClaimsTested.includes(p.name)
    );
    if (nextProject && (wantsCat('Project') || wantsCat('Resume'))) {
      const topTech = nextProject.technologies[0] || 'System Design';
      return {
        skill: topTech,
        topic: `${nextProject.name} Scalability & Failure Modes`,
        difficulty,
        intent: 'project_deep_dive',
        reason: `Verifying project claim "${nextProject.name}".`,
      };
    }

    const remainingSkill = candidateProfile.skills.find((s) => !testedSet.has(s.toLowerCase()));
    if (remainingSkill) {
      return {
        skill: remainingSkill,
        topic: `${remainingSkill} Design Patterns & Tradeoffs`,
        difficulty,
        intent: 'skill_assessment',
        reason: `Assessing proficiency in resume skill ${remainingSkill}.`,
      };
    }

    // Fallback: System Architecture & Problem Solving
    const fallbackSkill = candidateProfile.skills[questionIndex % Math.max(1, candidateProfile.skills.length)] || 'System Architecture';
    return {
      skill: fallbackSkill,
      topic: `${fallbackSkill} Scalability, Security, & Resilience`,
      difficulty,
      intent: 'system_design',
      reason: 'General technical and system architecture evaluation.',
    };
  }
}
