import {
  capitalizeSkill,
  dedupeCanonicalSkills,
  findMatchingSkill,
  normalizeToken,
  skillsMatch,
  toCanonicalSkill,
} from '@/lib/resume/skill-normalizer';

const TECH_DICTIONARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
  'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'GraphQL', 'REST API',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'DynamoDB', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'DevOps', 'Microservices',
  'System Design', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass', 'Webpack', 'Vite',
  'Git', 'Linux', 'Agile', 'Scrum', 'Jira',
  'Jest', 'Cypress', 'Playwright', 'Unit Testing', 'Integration Testing',
  'OAuth', 'JWT', 'Security', 'API Design', 'Data Structures', 'Algorithms',
  'Kafka', 'RabbitMQ', 'gRPC', 'WebSockets', 'Serverless', 'Lambda',
  'Figma', 'UI/UX', 'Responsive Design', 'Accessibility',
  'Snowflake', 'Spark', 'Airflow', 'dbt', 'ETL', 'Data Pipeline',
  'React Native', 'Flutter', 'iOS', 'Android',
];

const WEAK_BULLET_PATTERNS = [
  /^helped\b/i,
  /^worked on\b/i,
  /^responsible for\b/i,
  /^assisted\b/i,
  /^participated\b/i,
  /^involved in\b/i,
  /^duties included\b/i,
  /^tasked with\b/i,
];

const STRONG_ACTION_VERBS = [
  'built', 'engineered', 'developed', 'designed', 'implemented', 'architected',
  'optimized', 'reduced', 'increased', 'led', 'automated', 'deployed', 'scaled',
  'migrated', 'integrated', 'delivered', 'achieved', 'improved', 'created',
];

const METRIC_PATTERN = /\d+\s*%|\$\d+|\d+[kKmMbB]\+?|\d+\s*(users|requests|ms|seconds|hours|days|x)/i;

export interface ATSKeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordMatchScore: number;
  atsScore: number;
  missingSkills: string[];
  weakBullets: string[];
  strongBullets: string[];
  formattingIssues: string[];
  improvementChecklist: string[];
}

function truncateText(text: string | null | undefined, maxLen = 3000): string {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.length <= maxLen ? trimmed : `${trimmed.slice(0, maxLen)}…`;
}

function collectResumeSkills(resume: Record<string, unknown>): string[] {
  const skills = Array.isArray(resume.skills) ? (resume.skills as string[]) : [];
  const technologies = Array.isArray(resume.technologies) ? (resume.technologies as string[]) : [];
  const projectTechs = (Array.isArray(resume.projects) ? resume.projects as Record<string, unknown>[] : [])
    .flatMap((p) => (Array.isArray(p.technologies) ? p.technologies as string[] : []));
  const expTechs = (Array.isArray(resume.experience) ? resume.experience as Record<string, unknown>[] : [])
    .flatMap((e) => (Array.isArray(e.technologies) ? e.technologies as string[] : []));

  return dedupeCanonicalSkills([...skills, ...technologies, ...projectTechs, ...expTechs]);
}

function collectResumeBullets(resume: Record<string, unknown>): string[] {
  const bullets: string[] = [];

  (Array.isArray(resume.experience) ? resume.experience as Record<string, unknown>[] : []).forEach((exp) => {
    if (Array.isArray(exp.bullets)) bullets.push(...(exp.bullets as string[]));
    if (typeof exp.description === 'string') bullets.push(exp.description);
  });

  (Array.isArray(resume.projects) ? resume.projects as Record<string, unknown>[] : []).forEach((proj) => {
    if (Array.isArray(proj.bullets)) bullets.push(...(proj.bullets as string[]));
    if (typeof proj.description === 'string') bullets.push(proj.description);
  });

  return bullets.filter(Boolean);
}

function buildResumeCorpus(resume: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof resume.summary === 'string') parts.push(resume.summary);
  collectResumeBullets(resume).forEach((b) => parts.push(b));
  collectResumeSkills(resume).forEach((s) => parts.push(s));

  (Array.isArray(resume.experience) ? resume.experience as Record<string, unknown>[] : []).forEach((exp) => {
    if (typeof exp.title === 'string') parts.push(exp.title);
    if (typeof exp.company === 'string') parts.push(exp.company);
  });

  return normalizeToken(parts.join(' '));
}

function extractJobKeywords(job?: {
  title?: string;
  description?: string | null;
  requirements?: string | null;
}): string[] {
  if (!job) {
    return ['Communication', 'Problem Solving', 'Teamwork', 'Software Engineering', 'Git'];
  }

  const combined = normalizeToken(
    [job.title, job.description, job.requirements].filter(Boolean).join(' ')
  );

  const found = new Set<string>();

  TECH_DICTIONARY.forEach((tech) => {
    const token = normalizeToken(tech);
    if (combined.includes(token) || combined.includes(token.replace(/\./g, ''))) {
      found.add(tech);
    }
  });

  // Extract explicit requirement phrases (e.g. "3+ years", skill lists after colons)
  const reqText = job.requirements || job.description || '';
  const listMatches = reqText.match(/(?:required|must have|proficiency in|experience with)[:\s]+([^\n.]+)/gi);
  listMatches?.forEach((match) => {
    match.split(/[,;|•]/).forEach((part) => {
      const cleaned = part.replace(/^(required|must have|proficiency in|experience with)[:\s]*/i, '').trim();
      if (cleaned.length >= 2 && cleaned.length <= 40) found.add(cleaned);
    });
  });

  // Always include title-derived keywords
  if (job.title) {
    job.title.split(/\s+/).forEach((word) => {
      if (word.length > 3) found.add(word);
    });
  }

  return dedupeCanonicalSkills(Array.from(found)).slice(0, 30);
}

function scoreBullet(bullet: string): 'weak' | 'strong' | 'neutral' {
  const trimmed = bullet.trim();
  if (trimmed.length < 10) return 'weak';

  const lower = trimmed.toLowerCase();
  const hasWeakOpener = WEAK_BULLET_PATTERNS.some((p) => p.test(trimmed));
  const hasActionVerb = STRONG_ACTION_VERBS.some((v) => lower.startsWith(v) || lower.includes(` ${v} `));
  const hasMetric = METRIC_PATTERN.test(trimmed);

  if (hasWeakOpener && !hasMetric) return 'weak';
  if (hasActionVerb && hasMetric) return 'strong';
  if (hasActionVerb) return 'neutral';
  if (!hasMetric && trimmed.split(/\s+/).length < 8) return 'weak';
  return 'neutral';
}

function detectFormattingIssues(resume: Record<string, unknown>, bullets: string[]): string[] {
  const issues: string[] = [];

  if (!resume.summary || String(resume.summary).trim().length < 30) {
    issues.push('Missing or very short professional summary — ATS parsers weight this section heavily.');
  }

  const skills = collectResumeSkills(resume);
  if (skills.length < 5) {
    issues.push('Skills section has fewer than 5 entries — add relevant technical keywords from the job description.');
  }

  const weakCount = bullets.filter((b) => scoreBullet(b) === 'weak').length;
  if (bullets.length > 0 && weakCount / bullets.length > 0.4) {
    issues.push(`${Math.round((weakCount / bullets.length) * 100)}% of bullets use passive phrasing or lack metrics — rewrite with action verbs and quantified results.`);
  }

  const noMetricBullets = bullets.filter((b) => !METRIC_PATTERN.test(b)).length;
  if (bullets.length >= 3 && noMetricBullets / bullets.length > 0.6) {
    issues.push('Most experience bullets lack quantified impact (%, numbers, scale) — ATS and recruiters favor measurable outcomes.');
  }

  if (!resume.email && !resume.phone) {
    issues.push('Missing contact information — ensure email and phone are parseable in plain text.');
  }

  return issues;
}

export function analyzeATSKeywords(
  resume: Record<string, unknown>,
  job?: {
    title?: string;
    description?: string | null;
    requirements?: string | null;
  }
): ATSKeywordAnalysis {
  const resumeSkills = collectResumeSkills(resume);
  const resumeCorpus = buildResumeCorpus(resume);
  const jobKeywords = extractJobKeywords(job);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  jobKeywords.forEach((keyword) => {
    const skillMatch = findMatchingSkill(resumeSkills, keyword);
    const corpusMatch = resumeCorpus.includes(normalizeToken(keyword))
      || resumeCorpus.includes(normalizeToken(keyword.replace(/\./g, '')));

    if (skillMatch || corpusMatch || resumeSkills.some((s) => skillsMatch(s, keyword))) {
      matchedKeywords.push(capitalizeSkill(keyword));
    } else {
      missingKeywords.push(capitalizeSkill(keyword));
    }
  });

  const keywordMatchScore = jobKeywords.length > 0
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 75;

  const bullets = collectResumeBullets(resume);
  const weakBullets = bullets.filter((b) => scoreBullet(b) === 'weak').slice(0, 6);
  const strongBullets = bullets.filter((b) => scoreBullet(b) === 'strong').slice(0, 6);

  const formattingIssues = detectFormattingIssues(resume, bullets);

  const bulletQualityScore = bullets.length > 0
    ? Math.round((strongBullets.length / bullets.length) * 100)
    : 60;

  const atsScore = Math.round(
    keywordMatchScore * 0.45 +
    bulletQualityScore * 0.25 +
    (formattingIssues.length === 0 ? 100 : Math.max(40, 100 - formattingIssues.length * 15)) * 0.20 +
    (resumeSkills.length >= 8 ? 100 : resumeSkills.length * 12) * 0.10
  );

  const missingSkills = missingKeywords.slice(0, 8);

  const improvementChecklist: string[] = [];
  if (missingKeywords.length > 0) {
    improvementChecklist.push(
      `Add missing keywords to your Skills or Summary: ${missingKeywords.slice(0, 5).join(', ')}.`
    );
  }
  if (weakBullets.length > 0) {
    improvementChecklist.push(
      `Rewrite weak bullets starting with passive phrases — e.g. "${weakBullets[0].slice(0, 60)}…"`
    );
  }
  if (formattingIssues.length > 0) {
    improvementChecklist.push(formattingIssues[0]);
  }
  if (strongBullets.length > 0) {
    improvementChecklist.push(
      `Keep leveraging strong patterns like: "${strongBullets[0].slice(0, 80)}…"`
    );
  }
  if (improvementChecklist.length === 0) {
    improvementChecklist.push('Resume aligns well with job keywords — fine-tune bullet metrics for top roles.');
  }

  return {
    matchedKeywords,
    missingKeywords,
    keywordMatchScore,
    atsScore: Math.min(100, Math.max(0, atsScore)),
    missingSkills,
    weakBullets,
    strongBullets,
    formattingIssues,
    improvementChecklist,
  };
}

export function buildCompactResumeForPrompt(resume: Record<string, unknown>): Record<string, unknown> {
  return {
    summary: truncateText(resume.summary as string, 400),
    skills: (Array.isArray(resume.skills) ? resume.skills : []).slice(0, 15),
    technologies: (Array.isArray(resume.technologies) ? resume.technologies : []).slice(0, 15),
    experience: (Array.isArray(resume.experience) ? resume.experience : []).slice(0, 4).map((e: Record<string, unknown>) => ({
      company: e.company,
      title: e.title,
      bullets: (Array.isArray(e.bullets) ? e.bullets : []).slice(0, 4),
    })),
    projects: (Array.isArray(resume.projects) ? resume.projects : []).slice(0, 3).map((p: Record<string, unknown>) => ({
      title: p.title || p.name,
      technologies: (Array.isArray(p.technologies) ? p.technologies : []).slice(0, 6),
      bullets: (Array.isArray(p.bullets) ? p.bullets : []).slice(0, 3),
    })),
  };
}

export function buildCompactJobForPrompt(job?: {
  title?: string;
  description?: string | null;
  requirements?: string | null;
  company?: { name?: string };
}): Record<string, unknown> | undefined {
  if (!job) return undefined;
  return {
    title: job.title,
    company: job.company?.name,
    description: truncateText(job.description, 1500),
    requirements: truncateText(job.requirements, 1000),
  };
}

export function formatATSChecklistMarkdown(
  analysis: ATSKeywordAnalysis,
  jobTitle?: string
): string {
  const lines = [
    `## ATS Keyword Checklist${jobTitle ? ` — ${jobTitle}` : ''}`,
    '',
    `**Keyword Match:** ${analysis.keywordMatchScore}% | **ATS Score:** ${analysis.atsScore}%`,
    '',
  ];

  if (analysis.matchedKeywords.length > 0) {
    lines.push('### Matched Keywords', analysis.matchedKeywords.map((k) => `- ✅ ${k}`).join('\n'), '');
  }

  if (analysis.missingKeywords.length > 0) {
    lines.push('### Missing Keywords (add to Skills/Summary)', analysis.missingKeywords.map((k) => `- ❌ ${k}`).join('\n'), '');
  }

  if (analysis.weakBullets.length > 0) {
    lines.push('### Bullets to Rewrite', ...analysis.weakBullets.map((b) => `- ⚠️ ${b}`), '');
  }

  if (analysis.strongBullets.length > 0) {
    lines.push('### Strong Bullets (keep this style)', ...analysis.strongBullets.map((b) => `- 💪 ${b}`), '');
  }

  lines.push('### Action Items', ...analysis.improvementChecklist.map((item, i) => `${i + 1}. ${item}`));

  return lines.join('\n');
}
