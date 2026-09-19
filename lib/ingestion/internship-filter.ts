import { OpportunityType } from '../generated/prisma/enums';

const FULL_TIME_SIGNALS =
  /\b(senior|staff|principal|director|head of|vp |vice president|manager|lead engineer|architect)\b/i;

const NON_INTERN_SIGNALS =
  /\b(full[- ]?time|fte|permanent|experienced hire|professional)\b/i;

/**
 * True only for internship / co-op / trainee roles (not fellowships, hackathons, or new grad).
 */
export function isInternshipRole(title: string, type?: string, description?: string): boolean {
  const text = `${title} ${type || ''} ${(description || '').slice(0, 500)}`.toLowerCase();

  const commitmentIsIntern =
    /\bintern(ship)?\b/.test((type || '').toLowerCase()) ||
    (type || '').toLowerCase().includes('co-op') ||
    (type || '').toLowerCase().includes('trainee');

  const titleIsIntern =
    /\bintern(ship)?\b/.test(text) ||
    text.includes('co-op') ||
    text.includes('co op') ||
    text.includes('trainee') ||
    text.includes('apprentice') ||
    text.includes('summer analyst') ||
    text.includes('winter analyst');

  if (!titleIsIntern && !commitmentIsIntern) {
    return false;
  }

  if (FULL_TIME_SIGNALS.test(text) && !/\bintern/.test(text)) {
    return false;
  }

  if (NON_INTERN_SIGNALS.test(text) && !/\bintern/.test(text)) {
    return false;
  }

  // Exclude explicit non-intern program types
  if (
    /\b(fellowship|hackathon|scholarship|new grad|newgrad|phd|postdoc|research scientist)\b/.test(
      text
    ) &&
    !/\bintern/.test(text)
  ) {
    return false;
  }

  return true;
}

export function enforceInternshipType(type: OpportunityType): OpportunityType {
  return OpportunityType.INTERNSHIP;
}
