import { prisma } from '../db';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export class SavedOpportunityRepository {
  static async findByUserAndOpportunity(userId: string, opportunityId: string) {
    return prisma.savedOpportunity.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });
  }

  static async findManyByUser(userId: string, params?: PaginationParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);

    const where = { userId };

    const [data, total] = await Promise.all([
      prisma.savedOpportunity.findMany({
        where,
        skip,
        take,
        orderBy: { savedAt: 'desc' },
        include: {
          opportunity: {
            include: {
              company: true,
            },
          },
        },
      }),
      prisma.savedOpportunity.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async save(userId: string, opportunityId: string) {
    return prisma.savedOpportunity.upsert({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
      create: {
        userId,
        opportunityId,
      },
      update: {}, // Do nothing if it already exists
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  static async unsave(userId: string, opportunityId: string) {
    return prisma.savedOpportunity.delete({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });
  }
}
