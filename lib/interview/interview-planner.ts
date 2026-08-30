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
  private static PATTERN_ROTATION: QuestionPattern[] = [
    'code_internals',
    'scaling_bottleneck',
    'failure_debugging',
    'architectural_tradeoff',
    'security_resilience',
    'real_world_scenario',
    'star_behavioral',
  ];

  private static normalizeCategory(cat: string): string {
    return cat.toLowerCase().replace(/[^a-z]/g, '');
  }

  private static wantsCat(categories: string[], cat: string): boolean {
    if (categories.length === 0) return true;
    const target = InterviewPlanner.normalizeCategory(cat);
    return categories.some((c) => InterviewPlanner.normalizeCategory(c).includes(target));
  }

  private static pickUntested<T>(
    items: T[],
    testedSet: Set<string>,
    keyFn: (item: T) => string
  ): T | undefined {
    return items.find((item) => !testedSet.has(keyFn(item).toLowerCase().trim()));
  }

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
      totalSessionQuestions,
      categories = [],
      previousEvaluation,
      testedSkillsInSession = [],
    } = params;

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

    const testedSet = new Set(testedSkillsInSession.map((s) => s.toLowerCase().trim()));
    candidateMemory.projectClaimsTested.forEach((p) => testedSet.add(p.toLowerCase()));
    candidateMemory.recentTopics.forEach((t) => testedSet.add(t.toLowerCase()));

    const patternIndex = questionIndex % InterviewPlanner.PATTERN_ROTATION.length;
    const selectedPattern: QuestionPattern = InterviewPlanner.PATTERN_ROTATION[patternIndex];

    const wantsResume = InterviewPlanner.wantsCat(categories, 'Resume');
    const wantsBehavioral = InterviewPlanner.wantsCat(categories, 'Behavioral');
    const wantsProblemSolving = InterviewPlanner.wantsCat(categories, 'Problem Solving');
    const wantsTechnical = InterviewPlanner.wantsCat(categories, 'Technical') || categories.length === 0;

    const onlyBehavioral =
      categories.length > 0 &&
      wantsBehavioral &&
      !wantsResume &&
      !wantsProblemSolving &&
      !wantsTechnical;

    // Follow-up on a missed concept from the previous answer
    if (previousEvaluation && previousEvaluation.score < 65 && previousEvaluation.missingConcept) {
      const missingKey = previousEvaluation.missingConcept.toLowerCase().trim();
      if (!testedSet.has(missingKey) && !testedSet.has(`probe-${missingKey}`)) {
        return {
          skill: previousEvaluation.topic,
          topic: previousEvaluation.missingConcept,
          difficulty,
          intent: 'weakness_probe',
          pattern: 'live_follow_up',
          reason: `Probing missed concept "${previousEvaluation.missingConcept}" (prior score ${previousEvaluation.score}%).`,
        };
      }
    }

    // Target chronically weak skills from past sessions
    const weakLongitudinal = longitudinalSkills
      .filter((s) => s.trend === 'weak' || s.recentScore < 60)
      .sort((a, b) => a.recentScore - b.recentScore);

    if (weakLongitudinal.length > 0 && questionIndex > 0 && questionIndex % 3 === 0) {
      const weakSkill = weakLongitudinal.find((s) => !testedSet.has(s.skill.toLowerCase())) || weakLongitudinal[0];
      if (!testedSet.has(weakSkill.skill.toLowerCase())) {
        return {
          skill: weakSkill.skill,
          topic: `${weakSkill.skill} — Reinforcement (historical avg ${weakSkill.averageScore}%)`,
          difficulty,
          intent: 'skill_assessment',
          pattern: selectedPattern,
          reason: `Re-testing weak longitudinal skill "${weakSkill.skill}" (trend: ${weakSkill.trend}).`,
        };
      }
    }

    // Behavioral-only sessions: rotate STAR questions grounded in resume
    if (onlyBehavioral) {
      const exp = InterviewPlanner.pickUntested(candidateProfile.experience, testedSet, (e) => e.company || e.role || '')
        || candidateProfile.experience[questionIndex % Math.max(1, candidateProfile.experience.length)];
      const proj = InterviewPlanner.pickUntested(candidateProfile.projects, testedSet, (p) => p.name)
        || candidateProfile.projects[questionIndex % Math.max(1, candidateProfile.projects.length)];

      const context = exp?.company
        ? `conflict or incident at ${exp.company}`
        : proj?.name
        ? `challenge while building "${proj.name}"`
        : 'a high-stakes technical disagreement';

      return {
        skill: 'Behavioral Communication',
        topic: context,
        difficulty,
        intent: 'behavioral',
        pattern: 'star_behavioral',
        reason: `Behavioral STAR question grounded in resume context: ${context}.`,
      };
    }

    // Resume-based slot: verify a specific project claim
    if (wantsResume && (questionIndex === 0 || questionIndex % 4 === 0)) {
      const untestedProject =
        InterviewPlanner.pickUntested(candidateProfile.projects, testedSet, (p) => p.name)
        || candidateProfile.projects[questionIndex % Math.max(1, candidateProfile.projects.length)];

      if (untestedProject) {
        const topSkill = untestedProject.technologies[0] || candidateProfile.skills[0] || 'Software Engineering';
        return {
          skill: topSkill,
          topic: `"${untestedProject.name}" — verify architecture & your contribution`,
          difficulty,
          intent: questionIndex === 0 ? 'project_deep_dive' : 'resume_verification',
          pattern: questionIndex === 0 ? 'code_internals' : 'real_world_scenario',
          reason: `Resume verification of project "${untestedProject.name}" using ${topSkill}.`,
        };
      }
    }

    // Problem-solving slot
    if (wantsProblemSolving && (questionIndex === 2 || questionIndex % 5 === 2)) {
      const targetSkill =
        InterviewPlanner.pickUntested(candidateProfile.skills, testedSet, (s) => s)
        || jobProfile?.coreSkills.find((s) => !testedSet.has(s.toLowerCase()))
        || candidateProfile.skills[questionIndex % Math.max(1, candidateProfile.skills.length)]
        || 'Backend Services';

      const exp = candidateProfile.experience[0];
      const contextName = exp?.company ? `at ${exp.company}` : '';

      return {
        skill: targetSkill,
        topic: `${targetSkill} production outage & diagnostic runbook ${contextName}`.trim(),
        difficulty,
        intent: 'debugging',
        pattern: 'failure_debugging',
        reason: `Problem-solving / debugging scenario for ${targetSkill}.`,
      };
    }

    // Opening question when resume category not prioritized
    if (questionIndex === 0) {
      const untestedProject =
        InterviewPlanner.pickUntested(candidateProfile.projects, testedSet, (p) => p.name)
        || candidateProfile.projects[0];
      const topSkill = untestedProject?.technologies[0] || candidateProfile.skills[0] || 'System Architecture';
      const projectName = untestedProject?.name || 'Primary Project';

      return {
        skill: topSkill,
        topic: `${projectName} — core mechanics & design decisions`,
        difficulty,
        intent: 'project_deep_dive',
        pattern: 'code_internals',
        reason: `Opening question on ${topSkill} in "${projectName}".`,
      };
    }

    // Job-aligned skill at Q1
    if (questionIndex === 1 && jobProfile) {
      const targetSkill =
        jobProfile.coreSkills.find((s) => !testedSet.has(s.toLowerCase()))
        || jobProfile.coreSkills[0]
        || candidateProfile.skills[0]
        || 'Distributed Systems';

      return {
        skill: targetSkill,
        topic: `${targetSkill} scalability, concurrency & bottlenecks`,
        difficulty,
        intent: 'system_design',
        pattern: 'scaling_bottleneck',
        reason: `Job-aligned scaling question for ${targetSkill}.`,
      };
    }

    // Behavioral near end of session
    if (wantsBehavioral && (questionIndex === totalSessionQuestions - 1 || questionIndex % 6 === 5)) {
      return {
        skill: 'Engineering Leadership',
        topic: 'Resolving disagreements & production escalations (STAR)',
        difficulty,
        intent: 'behavioral',
        pattern: 'star_behavioral',
        reason: 'Closing behavioral assessment using STAR format.',
      };
    }

    // Rotate through untested skills / projects
    const remainingProject = InterviewPlanner.pickUntested(candidateProfile.projects, testedSet, (p) => p.name);
    const remainingSkill =
      InterviewPlanner.pickUntested(candidateProfile.skills, testedSet, (s) => s)
      || InterviewPlanner.pickUntested(candidateProfile.technologies, testedSet, (t) => t)
      || candidateProfile.skills[questionIndex % Math.max(1, candidateProfile.skills.length)]
      || 'System Architecture';

    if (remainingProject && questionIndex % 2 === 0) {
      return {
        skill: remainingProject.technologies[0] || remainingSkill,
        topic: `"${remainingProject.name}" — edge cases, resilience & trade-offs`,
        difficulty,
        intent: 'project_deep_dive',
        pattern: selectedPattern,
        reason: `Deep dive on untested project "${remainingProject.name}".`,
      };
    }

    const intentMap: Record<QuestionPattern, QuestionIntent> = {
      code_internals: 'skill_assessment',
      scaling_bottleneck: 'system_design',
      failure_debugging: 'debugging',
      architectural_tradeoff: 'tradeoff_analysis',
      security_resilience: 'skill_assessment',
      real_world_scenario: 'scenario_based',
      star_behavioral: 'behavioral',
      live_follow_up: 'follow_up',
    };

    return {
      skill: remainingSkill,
      topic: `${remainingSkill} — advanced patterns & failure modes`,
      difficulty,
      intent: intentMap[selectedPattern] || 'skill_assessment',
      pattern: selectedPattern,
      reason: `Rotating ${selectedPattern} assessment for ${remainingSkill}.`,
    };
  }
}
