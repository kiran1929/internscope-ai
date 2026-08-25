import { prisma } from '../db';

export class TargetCompanyRepository {
  static async isTracking(userId: string, companyId: string): Promise<boolean> {
    const record = await prisma.targetCompany.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });
    return !!record;
  }

  static async track(userId: string, companyId: string) {
    return prisma.targetCompany.upsert({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      create: {
        userId,
        companyId,
      },
      update: {}, // Do nothing if already tracking
    });
  }

  static async untrack(userId: string, companyId: string) {
    return prisma.targetCompany.delete({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });
  }

  static async findTrackedByUser(userId: string) {
    const records = await prisma.targetCompany.findMany({
      where: { userId },
      include: {
        company: {
          include: {
            opportunities: {
              where: { isArchived: false, isActive: true },
            },
            _count: {
              select: { opportunities: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => r.company);
  }
}
