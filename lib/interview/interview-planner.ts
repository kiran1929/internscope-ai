import {
  CandidateResumeProfile,
  JobInterviewProfile,
  CandidateInterviewMemory,
  InterviewDifficulty,
  QuestionIntent,
  QuestionPattern,
  CompactAnswerSummary,
  LongitudinalSkillRecord,
} from './llm/types';

export interface PlannedQuestionPlan {
  skill: string;
  topic: string;
  difficulty: InterviewDifficulty;
  intent: QuestionIntent;
  pattern: QuestionPattern;
  reason: string;
}

export class InterviewPlanner {
  /**
   * Pattern cycle mapped deterministically across question indices
   * to guarantee pattern variety (e.g. Code Internals -> Scale Bottleneck -> Failure Debugging -> Architectural Tradeoff -> Security & Concurrency -> Behavioral).
   */
  private static PATTERN_ROTATION: QuestionPattern[] = [
    'code_internals',
    'scaling_bottleneck',
    'failure_debugging',
    'architectural_tradeoff',
    'security_resilience',
    'real_world_scenario',
    'star_behavioral',
  ];

  /**
   * Deterministic decision engine deciding WHAT to test, WHY, at what DIFFICULTY, and with what PATTERN & INTENT.
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
      sessionDifficulty,
      questionIndex,
      categories = [],
      previousEvaluation,
      testedSkillsInSession = [],
    } = params;

    // 1. Determine Difficulty adaptively based on previous evaluation
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

    // Helper to check if a category is requested
    const wantsCat = (cat: string) => categories.length === 0 || categories.some(c => c.toLowerCase().includes(cat.toLowerCase()));

    // Adaptive Check: Follow-up on weak concept if previous answer was insufficient
    if (previousEvaluation && previousEvaluation.score < 65 && previousEvaluation.missingConcept) {
      const missingKey = previousEvaluation.missingConcept.toLowerCase().trim();
      if (!testedSet.has(missingKey) && !testedSet.has(`probe-${missingKey}`)) {
        return {
          skill: previousEvaluation.topic,
          topic: previousEvaluation.missingConcept,
          difficulty,
          intent: 'weakness_probe',
          pattern: 'live_follow_up',
          reason: `Candidate missed "${previousEvaluation.missingConcept}" on previous question (${previousEvaluation.score}%). Probing depth.`,
        };
      }
    }

    // Pattern Selection: Rotate pattern by index
    const patternIndex = questionIndex % InterviewPlanner.PATTERN_ROTATION.length;
    let selectedPattern: QuestionPattern = InterviewPlanner.PATTERN_ROTATION[patternIndex];

    // Stage 1: Question 0 (Opening) -> Core Internal Mechanics of Primary or Untested Project
    if (questionIndex === 0) {
      // Pick a project that hasn't been tested yet, or rotate among projects
      const untestedProject = candidateProfile.projects.find(p => !testedSet.has(p.name.toLowerCase())) || candidateProfile.projects[0];
      const topSkill = untestedProject?.technologies[0] || candidateProfile.skills[0] || 'System Architecture';
      const projectName = untestedProject?.name || 'Primary Project';

      return {
        skill: topSkill,
        topic: `${projectName} — Core Internal Mechanics & Protocol Design`,
        difficulty,
        intent: 'project_deep_dive',
        pattern: 'code_internals',
        reason: `Opening question probing low-level mechanics of ${topSkill} in project "${projectName}".`,
      };
    }

    // Stage 2: Question 1 -> High Throughput & Scaling Bottleneck
    if (questionIndex === 1) {
      // Pick next untested skill from job requirement, technologies, or skills list
      const targetSkill = jobProfile?.coreSkills.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.technologies.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.skills.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.skills[1]
        || 'Distributed Systems';

      return {
        skill: targetSkill,
        topic: `${targetSkill} Concurrency, Partitioning & Bottleneck Analysis`,
        difficulty,
        intent: 'system_design',
        pattern: 'scaling_bottleneck',
        reason: `Testing scaling limits, concurrency, and bottlenecks with ${targetSkill}.`,
      };
    }

    // Stage 3: Question 2 -> Production Incidents & Failure Debugging
    if (questionIndex === 2) {
      const experience = candidateProfile.experience.find(e => e.company && !testedSet.has(e.company.toLowerCase())) || candidateProfile.experience[0];
      const secondProject = candidateProfile.projects[1];
      const targetSkill = experience?.technologies.find(t => !testedSet.has(t.toLowerCase()))
        || secondProject?.technologies.find(t => !testedSet.has(t.toLowerCase()))
        || candidateProfile.skills.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.skills[2]
        || 'Backend Services';

      const contextName = experience?.company ? `at ${experience.company}` : secondProject?.name ? `in ${secondProject.name}` : '';

      return {
        skill: targetSkill,
        topic: `${targetSkill} Outages, Connection Pool Exhaustion & Diagnostic Runbook ${contextName}`.trim(),
        difficulty,
        intent: 'debugging',
        pattern: 'failure_debugging',
        reason: `Evaluating real-world diagnostic triage and debugging capabilities with ${targetSkill}.`,
      };
    }

    // Stage 4: Question 3 -> Architectural Trade-Offs & Framework Evaluation
    if (questionIndex === 3) {
      const untestedSkill = candidateProfile.skills.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.technologies.find(t => !testedSet.has(t.toLowerCase()))
        || candidateProfile.skills[0]
        || 'Database Design';

      return {
        skill: untestedSkill,
        topic: `${untestedSkill} vs Alternatives — Trade-off & Compromise Analysis`,
        difficulty,
        intent: 'tradeoff_analysis',
        pattern: 'architectural_tradeoff',
        reason: `Analyzing justification of architectural choices and trade-offs in ${untestedSkill}.`,
      };
    }

    // Stage 5: Question 4 -> Security & Data Integrity / Concurrency Hazards
    if (questionIndex === 4) {
      const targetSkill = candidateProfile.technologies.find(t => !testedSet.has(t.toLowerCase()))
        || candidateProfile.skills.find(s => !testedSet.has(s.toLowerCase()))
        || candidateProfile.skills[3]
        || 'Application Security';

      return {
        skill: targetSkill,
        topic: `${targetSkill} Security Vulnerabilities, Injection, & Race Conditions`,
        difficulty,
        intent: 'skill_assessment',
        pattern: 'security_resilience',
        reason: `Testing defensive engineering, race condition prevention, and security with ${targetSkill}.`,
      };
    }

    // Stage 6: Behavioral Question (if requested)
    if (wantsCat('Behavioral') && (questionIndex === 5 || questionIndex === params.totalSessionQuestions - 1)) {
      return {
        skill: 'Engineering Leadership & STAR Communication',
        topic: 'Resolving Architectural Disagreements & Production Escalations',
        difficulty,
        intent: 'behavioral',
        pattern: 'star_behavioral',
        reason: 'Assessing communication, ownership, and STAR story structuring under pressure.',
      };
    }

    // Subsequent/Fallback Questions: Cycle dynamically across remaining untested skills with rotated patterns
    const remainingProject = candidateProfile.projects.find(p => !testedSet.has(p.name.toLowerCase()));
    const remainingSkill = candidateProfile.skills.find(s => !testedSet.has(s.toLowerCase())) || candidateProfile.skills[questionIndex % Math.max(1, candidateProfile.skills.length)] || 'System Architecture';

    if (remainingProject && (questionIndex % 2 === 0)) {
      return {
        skill: remainingProject.technologies[0] || 'System Architecture',
        topic: `${remainingProject.name} — Real-world Edge Cases & Resilience`,
        difficulty,
        intent: 'project_deep_dive',
        pattern: selectedPattern,
        reason: `Probing project claim "${remainingProject.name}" with pattern ${selectedPattern}.`,
      };
    }

    return {
      skill: remainingSkill,
      topic: `${remainingSkill} Advanced Patterns & Failure Modes`,
      difficulty,
      intent: 'skill_assessment',
      pattern: selectedPattern,
      reason: `Evaluating ${remainingSkill} with rotated interview pattern ${selectedPattern}.`,
    };
  }
}
