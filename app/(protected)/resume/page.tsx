import React from 'react';
import { getAuthenticatedUser } from '@/app/actions/candidate';
import { prisma } from '@/lib/db';
import CandidateResumeClient from '@/components/CandidateResumeClient';

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const user = await getAuthenticatedUser();

  // 1. Fetch user's upload history
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { version: 'desc' },
  });

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

  // 2. Fetch the latest parsed resume details
  const latestParsed = resumes.find((r) => r.isParsed);
  // Fallback to the absolute latest if none parsed successfully yet
  const latest = latestParsed || resumes[0] || null;

  const mappedLatest = latest ? {
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
  } : null;

  return (
    <CandidateResumeClient
      resumes={mappedHistory}
      latestResume={mappedLatest}
    />
  );
}
