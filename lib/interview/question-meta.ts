import { GeneratedQuestionPayload, QuestionIntent, QuestionPattern } from './llm/types';

export interface InterviewQuestionMeta {
  targetSkill: string;
  topic: string;
  intent: QuestionIntent;
  pattern?: QuestionPattern;
  expectedConcepts: string[];
}

export function buildQuestionMeta(payload: GeneratedQuestionPayload): InterviewQuestionMeta {
  return {
    targetSkill: payload.skill || 'General',
    topic: payload.topic || payload.category,
    intent: payload.intent || 'skill_assessment',
    pattern: payload.pattern,
    expectedConcepts: payload.expectedConcepts || [],
  };
}

export function parseQuestionMeta(raw: unknown): InterviewQuestionMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.targetSkill !== 'string' || typeof data.topic !== 'string') return null;
  return {
    targetSkill: data.targetSkill,
    topic: data.topic,
    intent: (data.intent as QuestionIntent) || 'skill_assessment',
    pattern: data.pattern as QuestionPattern | undefined,
    expectedConcepts: Array.isArray(data.expectedConcepts)
      ? (data.expectedConcepts as string[])
      : [],
  };
}

/** Normalize text for duplicate / near-duplicate detection. */
export function normalizeQuestionText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isDuplicateQuestion(candidate: string, existing: string[]): boolean {
  const normalized = normalizeQuestionText(candidate);
  if (!normalized) return false;

  return existing.some((q) => {
    const other = normalizeQuestionText(q);
    if (!other) return false;
    if (normalized === other) return true;
    // Near-duplicate: one contains 80%+ of the other's words
    const aWords = new Set(normalized.split(' ').filter((w) => w.length > 3));
    const bWords = new Set(other.split(' ').filter((w) => w.length > 3));
    if (aWords.size === 0 || bWords.size === 0) return false;
    let overlap = 0;
    aWords.forEach((w) => {
      if (bWords.has(w)) overlap++;
    });
    const ratio = overlap / Math.min(aWords.size, bWords.size);
    return ratio >= 0.8;
  });
}

export function collectTestedItemsFromQuestions(
  questions: Array<{ category: string; text: string; generationMeta?: unknown }>
): string[] {
  const items = new Set<string>();

  questions.forEach((q) => {
    items.add(q.category.toLowerCase());
    const meta = parseQuestionMeta(q.generationMeta);
    if (meta) {
      items.add(meta.targetSkill.toLowerCase());
      items.add(meta.topic.toLowerCase());
      meta.expectedConcepts.forEach((c) => items.add(c.toLowerCase()));
    }
    const quotes = q.text.match(/"([^"]+)"/g);
    quotes?.forEach((qt) => items.add(qt.replace(/"/g, '').toLowerCase()));
  });

  return Array.from(items);
}
