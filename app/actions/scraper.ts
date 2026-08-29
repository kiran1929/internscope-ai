'use server';

import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { Role } from '@/lib/generated/prisma/enums';
import { IngestionQueue } from '@/lib/ingestion/queue';
import { JobRepository } from '@/lib/repositories/job';
import { revalidatePath } from 'next/cache';
import { EnrichmentEngine } from '@/lib/ai/enrichment-engine';

async function checkAdminAuth() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const dbUser = await UserRepository.findByClerkId(userId);
  if (!dbUser || (dbUser.role !== Role.ADMIN && dbUser.role !== Role.SUPER_ADMIN)) {
    throw new Error('Forbidden');
  }
}

export async function triggerSyncAction(provider: string) {
  try {
    await checkAdminAuth();
    const jobId = await IngestionQueue.runJob(provider);
    revalidatePath('/admin/scraper');
    return { success: true, jobId };
  } catch (error) {
    console.error('Trigger sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function retrySyncAction(jobId: string) {
  try {
    await checkAdminAuth();
    const job = await JobRepository.findById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    const newJobId = await IngestionQueue.runJob(job.provider);
    revalidatePath('/admin/scraper');
    return { success: true, jobId: newJobId };
  } catch (error) {
    console.error('Retry sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getSyncHistoryAction() {
  try {
    await checkAdminAuth();
    const history = await JobRepository.getHistory();
    return { success: true, history };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function triggerEnrichmentAction() {
  try {
    await checkAdminAuth();
    (async () => {
      try {
        await EnrichmentEngine.drainAllPending();
      } catch (err) {
        console.error('Manual enrichment run failed:', err);
      }
    })();
    revalidatePath('/admin/scraper');
    return { success: true };
  } catch (error) {
    console.error('Trigger enrichment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
