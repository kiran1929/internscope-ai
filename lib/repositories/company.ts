import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface CompanyFilterParams extends PaginationParams {
  search?: string;
  industry?: string;
  hiringStatus?: string;
  isVerified?: boolean;
  country?: string;
  companySize?: string;
  isArchived?: boolean;
  sortBy?: 'newest' | 'oldest' | 'alphabetical' | 'opportunities' | 'recently_updated';
}

export class CompanyRepository {
  static async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        opportunities: {
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { opportunities: true },
        },
      },
    });
  }

  static async findByName(name: string) {
    return prisma.company.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    });
  }

  static async findByLinkedIn(linkedinUrl: string) {
    return prisma.company.findFirst({
      where: { linkedinUrl },
    });
  }

  static async findByWebsite(websiteUrl: string) {
    return prisma.company.findFirst({
      where: { websiteUrl },
    });
  }

  static async findByCareerPage(careerPageUrl: string) {
    return prisma.company.findFirst({
      where: { careerPageUrl },
    });
  }

  static async findMany(params?: CompanyFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);
    const andFilters: Prisma.CompanyWhereInput[] = [];

    if (params?.search) {
      const searchStr = params.search.trim();
      andFilters.push({
        OR: [
          { name: { contains: searchStr, mode: 'insensitive' } },
          { industry: { contains: searchStr, mode: 'insensitive' } },
          { websiteUrl: { contains: searchStr, mode: 'insensitive' } },
          { description: { contains: searchStr, mode: 'insensitive' } },
          { city: { contains: searchStr, mode: 'insensitive' } },
          { state: { contains: searchStr, mode: 'insensitive' } },
          { country: { contains: searchStr, mode: 'insensitive' } },
        ],
      });
    }

    if (params?.industry) {
      andFilters.push({ industry: params.industry });
    }
    if (params?.hiringStatus) {
      andFilters.push({ hiringStatus: params.hiringStatus });
    }
    if (params?.isVerified !== undefined) {
      andFilters.push({ isVerified: params.isVerified });
    }
    if (params?.country) {
      andFilters.push({ country: params.country });
    }
    if (params?.companySize) {
      andFilters.push({ companySize: params.companySize });
    }
    if (params?.isArchived !== undefined) {
      andFilters.push({ isArchived: params.isArchived });
    } else {
      // By default show non-archived companies unless specifically queried
      andFilters.push({ isArchived: false });
    }

    const where: Prisma.CompanyWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

    // Build ordering clause
    let orderBy: Prisma.CompanyOrderByWithRelationInput = { name: 'asc' };
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'alphabetical':
          orderBy = { name: 'asc' };
          break;
        case 'recently_updated':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'opportunities':
          orderBy = { opportunities: { _count: 'desc' } };
          break;
      }
    }

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { opportunities: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async create(data: Prisma.CompanyCreateInput) {
    return prisma.company.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.CompanyUpdateInput) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.company.delete({
      where: { id },
    });
  }
}
