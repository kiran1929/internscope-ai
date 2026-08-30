import { prisma } from '../db';
import { startOfToday } from './deadline-utils';

export async function deleteExpiredOpportunities(): Promise<number> {
  const today = startOfToday();
  const result = await prisma.opportunity.deleteMany({
    where: {
      deadline: { lt: today },
    },
  });
  return result.count;
}
