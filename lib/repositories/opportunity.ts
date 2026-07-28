import { prisma } from '../db.js';
import { OpportunityType, RemoteType, Prisma } from '../generated/prisma/client.js';
import { getPaginationOptions, buildPaginatedResult, buildSearchFilter, PaginationParams } from '../db-utils.js';

export interface OpportunityFilterParams extends PaginationParams {
  search?: string;
  type?: OpportunityType;
  remoteType?: RemoteType;
  location?: string;
  activeOnly?: boolean;
  sortBy?: 'deadline' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class OpportunityRepository {
  static async findById(id: string) {
    return prisma.opportunity.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }

  static async findMany(params?: OpportunityFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);
    
    // Search filter
    const searchFilter = buildSearchFilter(params?.search, ['title', 'description', 'requirements']);

    // Build query where parameters
    const where: Prisma.OpportunityWhereInput = {
      ...searchFilter,
      ...(params?.type && { type: params.type }),
      ...(params?.remoteType && { remoteType: params.remoteType }),
      ...(params?.location && {
        location: {
          contains: params.location,
          mode: 'insensitive',
        },
      }),
      ...(params?.activeOnly !== undefined && { isActive: params.activeOnly }),
    };

    // Build sort order
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';
    const orderBy: Prisma.OpportunityOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          company: true,
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async create(data: Prisma.OpportunityCreateWithoutCompanyInput & { companyId: string }) {
    return prisma.opportunity.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        requirements: data.requirements,
        location: data.location,
        remoteType: data.remoteType,
        salaryRange: data.salaryRange,
        benefits: data.benefits,
        applicationUrl: data.applicationUrl,
        deadline: data.deadline,
        isActive: data.isActive !== undefined ? data.isActive : true,
        company: {
          connect: { id: data.companyId },
        },
      },
      include: {
        company: true,
      },
    });
  }

  static async update(id: string, data: Prisma.OpportunityUpdateInput) {
    return prisma.opportunity.update({
      where: { id },
      data,
      include: {
        company: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.opportunity.delete({
      where: { id },
    });
  }
}
