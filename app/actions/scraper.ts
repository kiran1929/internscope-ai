'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { IngestionQueue } from '@/lib/ingestion/queue';
import { JobRepository } from '@/lib/repositories/job';
import { revalidatePath } from 'next/cache';
import { EnrichmentEngine } from '@/lib/ai/enrichment-engine';
import { sanitizeError } from '@/lib/security/error-handler';

export async function triggerSyncAction(provider: string) {
  try {
    await requireAdmin();
    const jobId = await IngestionQueue.runJob(provider);
    revalidatePath('/admin/scraper');
    return { success: true, jobId };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to trigger scraper sync.'),
    };
  }
}

export async function retrySyncAction(jobId: string) {
  try {
    await requireAdmin();
    const job = await JobRepository.findById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    const newJobId = await IngestionQueue.runJob(job.provider);
    revalidatePath('/admin/scraper');
    return { success: true, jobId: newJobId };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to retry sync job.'),
    };
  }
}

export async function getSyncHistoryAction() {
  try {
    await requireAdmin();
    const history = await JobRepository.getHistory();
    return { success: true, history };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to fetch sync history.'),
    };
  }
}

export async function triggerEnrichmentAction() {
  try {
    await requireAdmin();
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
    return {
      success: false,
      error: sanitizeError(error, 'Failed to trigger enrichment process.'),
    };
  }
}
