/** Canonical skill groups — any alias maps to the same canonical key. */
const SKILL_GROUPS: string[][] = [
  ['javascript', 'js', 'ecmascript'],
  ['typescript', 'ts'],
  ['node.js', 'nodejs', 'node js', 'node'],
  ['react', 'react.js', 'reactjs'],
  ['next.js', 'nextjs', 'next js'],
  ['vue', 'vue.js', 'vuejs'],
  ['angular', 'angularjs'],
  ['python', 'py'],
  ['c++', 'cpp', 'c plus plus'],
  ['c#', 'csharp', 'c sharp'],
  ['postgresql', 'postgres', 'psql'],
  ['mongodb', 'mongo'],
  ['mysql', 'mariadb'],
  ['redis', 'elasticache'],
  ['docker', 'containerization', 'containers'],
  ['kubernetes', 'k8s'],
  ['aws', 'amazon web services'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['azure', 'microsoft azure'],
  ['graphql', 'gql'],
  ['rest api', 'restful', 'rest apis', 'rest'],
  ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'devops'],
  ['machine learning', 'ml', 'deep learning'],
  ['artificial intelligence', 'ai'],
  ['system design', 'systems design', 'distributed systems'],
  ['microservices', 'micro services'],
  ['tailwind css', 'tailwindcss', 'tailwind'],
  ['express', 'express.js', 'expressjs'],
  ['spring boot', 'springboot'],
  ['fastapi', 'fast api'],
  ['django', 'flask'],
  ['tensorflow', 'pytorch', 'keras'],
  ['sql', 'structured query language'],
  ['nosql', 'no sql'],
  ['agile', 'scrum', 'kanban'],
  ['git', 'github', 'gitlab', 'bitbucket'],
  ['linux', 'unix'],
  ['html', 'html5'],
  ['css', 'css3'],
  ['sass', 'scss'],
  ['webpack', 'vite', 'rollup'],
  ['jest', 'vitest', 'mocha', 'cypress', 'playwright'],
  ['figma', 'sketch', 'adobe xd'],
  ['kafka', 'rabbitmq', 'sqs'],
  ['terraform', 'pulumi', 'cloudformation'],
  ['helm', 'argocd'],
  ['prometheus', 'grafana', 'datadog'],
  ['oauth', 'oauth2', 'jwt', 'authentication'],
  ['api design', 'api development'],
  ['data structures', 'algorithms', 'dsa'],
  ['object oriented', 'oop', 'object-oriented'],
  ['functional programming', 'fp'],
];

const CANONICAL_MAP = new Map<string, string>();
SKILL_GROUPS.forEach((group) => {
  const canonical = group[0];
  group.forEach((alias) => CANONICAL_MAP.set(normalizeToken(alias), canonical));
});

export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toCanonicalSkill(value: string): string {
  const normalized = normalizeToken(value);
  if (!normalized) return '';
  if (CANONICAL_MAP.has(normalized)) return CANONICAL_MAP.get(normalized)!;

  // Partial alias match (e.g. "react native" contains "react")
  for (const [alias, canonical] of CANONICAL_MAP.entries()) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return canonical;
    }
  }

  return normalized;
}

export function skillsMatch(resumeSkill: string, jobSkill: string): boolean {
  const a = toCanonicalSkill(resumeSkill);
  const b = toCanonicalSkill(jobSkill);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export function findMatchingSkill(resumeSkills: string[], jobSkill: string): string | null {
  const match = resumeSkills.find((s) => skillsMatch(s, jobSkill));
  return match || null;
}

export function dedupeCanonicalSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  skills.forEach((skill) => {
    const canonical = toCanonicalSkill(skill);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      result.push(skill);
    }
  });
  return result;
}

export function capitalizeSkill(s: string): string {
  if (!s) return s;
  return s
    .split(/[\s/]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
