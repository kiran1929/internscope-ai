import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import { getResumeOptimizerData } from '@/lib/resume/optimizer-data';
import CandidateResumeClient from '@/components/CandidateResumeClient';

export const dynamic = 'force-dynamic';

type ResumeTab = 'profile' | 'quality' | 'history' | 'ats';

interface PageProps {
  searchParams: Promise<{ tab?: string; job?: string }>;
}

export default async function ResumePage({ searchParams }: PageProps) {
  const { tab, job } = await searchParams;
  const user = await getAuthenticatedUser();

  const [resumes, optimizerData] = await Promise.all([
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { version: 'desc' },
    }),
    getResumeOptimizerData(user.id),
  ]);

  const mappedHistory = resumes.map((item) => ({
    id: item.id,
    fileName: item.fileName,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    createdAt: item.createdAt,
    version: item.version,
    isParsed: item.isParsed,
    parsingError: item.parsingError,
    qualityScore: item.qualityScore,
  }));

  const latestParsed = resumes.find((resume) => resume.isParsed);
  const latest = latestParsed || resumes[0] || null;

  const mappedLatest = latest
    ? {
        id: latest.id,
        fileName: latest.fileName,
        mimeType: latest.mimeType,
        isParsed: latest.isParsed,
        parsingError: latest.parsingError,
        parserVersion: latest.parserVersion,
        aiProvider: latest.aiProvider,
        confidenceScore: latest.confidenceScore,
        processingTimeMs: latest.processingTimeMs,
        qualityScore: latest.qualityScore,
        qualityFeedback: latest.qualityFeedback || [],
        structuredData: latest.structuredData || null,
        createdAt: latest.createdAt,
      }
    : null;

  const validTabs: ResumeTab[] = ['profile', 'quality', 'history', 'ats'];
  const initialTab = validTabs.includes(tab as ResumeTab) ? (tab as ResumeTab) : 'profile';

  return (
    <CandidateResumeClient
      resumes={mappedHistory}
      latestResume={mappedLatest}
      optimizations={optimizerData.optimizations}
      jobOptions={optimizerData.jobOptions}
      initialTab={initialTab}
      preselectedJobId={job}
    />
  );
}
