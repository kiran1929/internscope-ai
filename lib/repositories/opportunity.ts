import { prisma } from '../db';
import { OpportunityType, RemoteType, Prisma } from '../generated/prisma/client';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface OpportunityFilterParams extends PaginationParams {
  search?: string;
  type?: OpportunityType;
  remoteType?: RemoteType;
  isActive?: boolean; // published/draft
  isArchived?: boolean;
  companyId?: string;
  sortBy?: 'newest' | 'oldest' | 'deadline' | 'company' | 'title';
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

    // Build query where parameters
    const where: Prisma.OpportunityWhereInput = {
      ...(params?.type && { type: params.type }),
      ...(params?.remoteType && { remoteType: params.remoteType }),
      ...(params?.isActive !== undefined && { isActive: params.isActive }),
      ...(params?.isArchived !== undefined ? { isArchived: params.isArchived } : { isArchived: false }), // default exclude archived
      ...(params?.companyId && { companyId: params.companyId }),
    };

    // Server-side search: Title, Company Name, Location, Tags
    if (params?.search) {
      const q = params.search;
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q] } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Build sort order
    let orderBy: Prisma.OpportunityOrderByWithRelationInput = { createdAt: 'desc' };
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'deadline':
          orderBy = { deadline: 'asc' };
          break;
        case 'company':
          orderBy = { company: { name: 'asc' } };
          break;
        case 'title':
          orderBy = { title: 'asc' };
          break;
      }
    }

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

  static async create(
    data: Prisma.OpportunityCreateWithoutCompanyInput & {
      companyId: string;
      tags?: string[];
      isArchived?: boolean;
    }
  ) {
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
        isArchived: data.isArchived !== undefined ? data.isArchived : false,
        tags: data.tags || [],
        company: {
          connect: { id: data.companyId },
        },
      },
      include: {
        company: true,
      },
    });
  }

  static async upsertByUrl(
    data: Prisma.OpportunityCreateWithoutCompanyInput & {
      companyId: string;
      tags?: string[];
      isArchived?: boolean;
    }
  ) {
    if (data.applicationUrl) {
      const existing = await prisma.opportunity.findFirst({
        where: { applicationUrl: data.applicationUrl.trim() },
        include: { company: true },
      });
      if (existing) {
        return existing;
      }
    }

    return this.create(data);
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
