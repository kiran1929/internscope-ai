import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import { ApplicationStatus } from '../generated/prisma/enums';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface ApplicationFilterParams extends PaginationParams {
  status?: ApplicationStatus;
}

export interface GlobalApplicationFilterParams extends PaginationParams {
  search?: string;
  status?: ApplicationStatus;
  companyId?: string;
  opportunityId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'newest' | 'oldest' | 'status' | 'recently_updated';
}

export class ApplicationRepository {
  static async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  static async findByUserAndOpportunity(userId: string, opportunityId: string) {
    return prisma.application.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId,
        },
      },
    });
  }

  static async findMany(params?: GlobalApplicationFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);
    const andFilters: Prisma.ApplicationWhereInput[] = [];

    if (params?.search) {
      const searchStr = params.search.trim();
      andFilters.push({
        OR: [
          { user: { email: { contains: searchStr, mode: 'insensitive' } } },
          { user: { profile: { firstName: { contains: searchStr, mode: 'insensitive' } } } },
          { user: { profile: { lastName: { contains: searchStr, mode: 'insensitive' } } } },
          { opportunity: { title: { contains: searchStr, mode: 'insensitive' } } },
          { opportunity: { company: { name: { contains: searchStr, mode: 'insensitive' } } } },
        ],
      });
    }

    if (params?.status) {
      andFilters.push({ status: params.status });
    }
    if (params?.companyId) {
      andFilters.push({ opportunity: { companyId: params.companyId } });
    }
    if (params?.opportunityId) {
      andFilters.push({ opportunityId: params.opportunityId });
    }
    if (params?.startDate) {
      andFilters.push({ appliedAt: { gte: params.startDate } });
    }
    if (params?.endDate) {
      andFilters.push({ appliedAt: { lte: params.endDate } });
    }

    const where: Prisma.ApplicationWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

    let orderBy: Prisma.ApplicationOrderByWithRelationInput = { createdAt: 'desc' };
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'newest':
          orderBy = { appliedAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { appliedAt: 'asc' };
          break;
        case 'recently_updated':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'status':
          orderBy = { status: 'asc' };
          break;
      }
    }

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          opportunity: {
            include: {
              company: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async findManyByUser(userId: string, params?: ApplicationFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);

    const where: Prisma.ApplicationWhereInput = {
      userId,
      ...(params?.status && { status: params.status }),
    };

    const [data, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          opportunity: {
            include: {
              company: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async create(data: {
    userId: string;
    opportunityId: string;
    status?: ApplicationStatus;
    notes?: string;
    appliedAt?: Date;
  }) {
    return prisma.application.create({
      data: {
        user: { connect: { id: data.userId } },
        opportunity: { connect: { id: data.opportunityId } },
        status: data.status || ApplicationStatus.SAVED,
        notes: data.notes,
        appliedAt: data.appliedAt || new Date(),
      },
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Prisma.ApplicationUpdateInput) {
    return prisma.application.update({
      where: { id },
      data,
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return prisma.application.delete({
      where: { id },
    });
  }
}
