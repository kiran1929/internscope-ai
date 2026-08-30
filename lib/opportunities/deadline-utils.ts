import { Prisma } from '../generated/prisma/client';

/** Midnight local time — compare calendar dates only. */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isDeadlineExpired(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  return date < startOfToday();
}

/** Prisma filter: active listings that are not past deadline. */
export function openOpportunityWhere(
  extra?: Prisma.OpportunityWhereInput
): Prisma.OpportunityWhereInput {
  const today = startOfToday();
  return {
    ...extra,
    isArchived: extra?.isArchived ?? false,
    isActive: extra?.isActive ?? true,
    OR: [{ deadline: null }, { deadline: { gte: today } }],
  };
}

const DEADLINE_PATTERNS = [
  /\b(?:deadline|apply by|applications close|closing date|due date)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  /\b(?:deadline|apply by|applications close|closing date|due date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  /\b(?:deadline|apply by|applications close|closing date|due date)[:\s]+(\d{4}-\d{2}-\d{2})/i,
];

export function extractDeadlineFromText(text: string): Date | null {
  if (!text) return null;

  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const parsed = new Date(match[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function resolveOpportunityDeadline(input: {
  explicit?: string | Date | null;
  metadataDeadline?: string | null;
  description?: string | null;
}): Date | null {
  if (input.explicit) {
    const parsed = new Date(input.explicit);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (input.metadataDeadline) {
    const parsed = new Date(input.metadataDeadline);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (input.description) {
    return extractDeadlineFromText(input.description);
  }

  return null;
}
