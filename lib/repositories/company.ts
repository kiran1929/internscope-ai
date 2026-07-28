import { prisma } from '../db.js';
import { Prisma } from '../generated/prisma/client.js';
import { getPaginationOptions, buildPaginatedResult, buildSearchFilter, PaginationParams } from '../db-utils.js';

export interface CompanyFilterParams extends PaginationParams {
  search?: string;
}

export class CompanyRepository {
  static async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  static async findByName(name: string) {
    return prisma.company.findUnique({
      where: { name },
    });
  }

  static async findMany(params?: CompanyFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);
    const searchFilter = buildSearchFilter(params?.search, ['name', 'industry', 'description']);

    const where: Prisma.CompanyWhereInput = {
      ...searchFilter,
    };

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
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
