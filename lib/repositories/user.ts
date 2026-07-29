import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface UserFilterParams extends PaginationParams {
  search?: string;
  role?: Role;
  isActive?: boolean;
  sortBy?: 'newest' | 'oldest' | 'name' | 'recently_updated';
}

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        emailPreference: true,
        savedOpportunities: {
          include: {
            opportunity: {
              include: {
                company: true,
              },
            },
          },
        },
        applications: {
          orderBy: { appliedAt: 'desc' },
          include: {
            opportunity: {
              include: {
                company: true,
              },
            },
          },
        },
        notifications: {
          take: 15,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async findByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async findMany(params?: UserFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);
    const andFilters: Prisma.UserWhereInput[] = [];

    if (params?.search) {
      const searchStr = params.search.trim();
      andFilters.push({
        OR: [
          { email: { contains: searchStr, mode: 'insensitive' } },
          {
            profile: {
              OR: [
                { firstName: { contains: searchStr, mode: 'insensitive' } },
                { lastName: { contains: searchStr, mode: 'insensitive' } },
                { major: { contains: searchStr, mode: 'insensitive' } },
                { skills: { hasSome: [searchStr] } },
              ],
            },
          },
        ],
      });
    }

    if (params?.role) {
      andFilters.push({ role: params.role });
    }
    if (params?.isActive !== undefined) {
      andFilters.push({ isActive: params.isActive });
    }

    const where: Prisma.UserWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' };
    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'name':
          orderBy = { profile: { firstName: 'asc' } };
          break;
        case 'recently_updated':
          orderBy = { updatedAt: 'desc' };
          break;
      }
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          profile: true,
          _count: {
            select: {
              savedOpportunities: true,
              applications: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async createUser(data: {
    clerkId: string;
    email: string;
    role?: Role;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    return prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        role: data.role || Role.USER,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            avatarUrl: data.avatarUrl,
            skills: [],
          },
        },
        emailPreference: {
          create: {
            weeklyDigest: true,
            instantAlerts: true,
            deadlineReminders: true,
          },
        },
      },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async updateRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  static async toggleActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  static async updateProfile(userId: string, data: Prisma.ProfileUpdateInput) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  static async updateEmailPreferences(userId: string, data: Prisma.EmailPreferenceUpdateInput) {
    return prisma.emailPreference.update({
      where: { userId },
      data,
    });
  }

  static async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
