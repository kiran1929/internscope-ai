import { prisma } from '../db';
import { JobStatus, IngestionJob, Prisma } from '../generated/prisma/client';

export class JobRepository {
  static async create(provider: string, triggerId?: string): Promise<IngestionJob> {
    return prisma.ingestionJob.create({
      data: {
        provider,
        status: JobStatus.RUNNING,
        triggerId,
        startedAt: new Date(),
        fetchedCount: 0,
        importedCount: 0,
        duplicateCount: 0,
        failedCount: 0,
      },
    });
  }

  static async update(
    id: string,
    data: Prisma.IngestionJobUpdateInput
  ): Promise<IngestionJob> {
    return prisma.ingestionJob.update({
      where: { id },
      data,
    });
  }

  static async findById(id: string): Promise<IngestionJob | null> {
    return prisma.ingestionJob.findUnique({
      where: { id },
    });
  }

  static async findRunning(provider?: string): Promise<IngestionJob[]> {
    return prisma.ingestionJob.findMany({
      where: {
        status: JobStatus.RUNNING,
        ...(provider ? { provider } : {}),
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  static async getHistory(limit = 20): Promise<IngestionJob[]> {
    return prisma.ingestionJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  static async getLastSuccessfulSync(provider: string): Promise<IngestionJob | null> {
    return prisma.ingestionJob.findFirst({
      where: {
        provider,
        status: JobStatus.COMPLETED,
      },
      orderBy: { finishedAt: 'desc' },
    });
  }

  static async getNextScheduledSync(provider: string): Promise<Date> {
    // Scheduled full sync runs twice daily (9 AM & 9 PM IST).
    const lastJob = await prisma.ingestionJob.findFirst({
      where: { provider },
      orderBy: { startedAt: 'desc' },
    });

    const baseTime = lastJob ? new Date(lastJob.startedAt) : new Date();
    const hours = 12;
    return new Date(baseTime.getTime() + hours * 60 * 60 * 1000);
  }
}
