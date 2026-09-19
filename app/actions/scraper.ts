'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { IngestionQueue } from '@/lib/ingestion/queue';
import { JobRepository } from '@/lib/repositories/job';
import { revalidatePath } from 'next/cache';
import { EnrichmentEngine } from '@/lib/ai/enrichment-engine';
import { sanitizeError } from '@/lib/security/error-handler';
import { EnrichmentRepository } from '@/lib/repositories/enrichment';
import { buildScraperMetricsDashboard } from '@/lib/ingestion/scraper-metrics';

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

export async function getScraperMetricsAction() {
  try {
    await requireAdmin();
    const [jobs, enrichmentStats] = await Promise.all([
      JobRepository.getMetricsHistory(50),
      EnrichmentRepository.getEnrichmentStats(),
    ]);
    const metrics = buildScraperMetricsDashboard(jobs, enrichmentStats.avgLatencyMs);
    return { success: true, metrics };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to fetch scraper metrics.'),
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

export async function getEnrichmentProgressAction() {
  try {
    await requireAdmin();
    const stats = await EnrichmentRepository.getEnrichmentStats();
    const isRunning = stats.running > 0;
    const total = stats.total || 0;
    const completed = stats.completed || 0;
    const progressPercent =
      total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 100;

    return {
      success: true,
      isRunning,
      stats,
      progressPercent,
    };
  } catch (error) {
    return {
      success: false,
      error: sanitizeError(error, 'Failed to fetch enrichment progress.'),
    };
  }
}

