import { prisma } from '../db';
import { ApplicationStatus, Prisma } from '../generated/prisma/client';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface ApplicationFilterParams extends PaginationParams {
  status?: ApplicationStatus;
}

export class ApplicationRepository {
  static async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
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
