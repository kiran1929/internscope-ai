import { prisma } from '../db';
import { JobStatus, IngestionJob, Prisma } from '../generated/prisma/client';
import {
  getNextScheduledScrapeTime,
} from '../ingestion/scraper-schedule';

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
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Auto-reconcile stale/zombie jobs from terminated serverless executions
    await prisma.ingestionJob.updateMany({
      where: {
        status: JobStatus.RUNNING,
        startedAt: { lt: tenMinutesAgo },
      },
      data: {
        status: JobStatus.FAILED,
        finishedAt: new Date(),
        error: 'Job timed out or worker process terminated unexpectedly.',
      },
    });

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

  static async getMetricsHistory(limit = 50): Promise<IngestionJob[]> {
    return prisma.ingestionJob.findMany({
      where: {
        status: { in: [JobStatus.COMPLETED, JobStatus.FAILED] },
      },
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

  static getNextScheduledSync(_provider: string): Date {
    return getNextScheduledScrapeTime();
  }
}
