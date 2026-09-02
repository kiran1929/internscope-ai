import { task } from '@trigger.dev/sdk/v3';
import { prisma } from '../lib/db';
import { StorageService } from '../lib/resume/storage-service';
import { ExtractionService } from '../lib/resume/extraction-service';
import { AIParserService } from '../lib/resume/ai-parser-service';
import { QualityService } from '../lib/resume/quality-service';
import { MatchEngine } from '../lib/resume/match-engine';
import { withBoundedRetry, isRetryableProviderError } from '../lib/security/processing';
import { careerAnalysisPipeline, runCareerAnalysisPipeline } from './career';

export interface ResumePipelinePayload {
  resumeId: string;
  userId: string;
}

export async function runResumeParsePipeline(payload: ResumePipelinePayload) {
  const startTime = Date.now();
  const { resumeId, userId } = payload;

  // 1. Retrieve the resume details from PostgreSQL DB
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    throw new Error(`Resume not found in DB with ID: ${resumeId}`);
  }

  if (resume.userId !== userId) {
    throw new Error('Forbidden: resume ownership mismatch');
  }

  await prisma.resume.update({
    where: { id: resumeId },
    data: { processingStatus: 'PROCESSING', parsingError: null },
  });

  try {
    // 2. Read file buffer from secure storage
    const buffer = await StorageService.readFile(resume.filePath);

    // 3. Document text extraction
    const extraction = await withBoundedRetry(
      () => ExtractionService.extractText(buffer, resume.mimeType),
      { shouldRetry: isRetryableProviderError }
    );

    if (extraction.isScanned) {
      throw new Error('Detected scanned PDF containing no indexable text. Please upload a structured text document.');
    }

    const parserResult = await withBoundedRetry(
      () => AIParserService.parseResume(extraction.text),
      { shouldRetry: isRetryableProviderError }
    );

    // 5. Evaluate resume quality metrics
    const qualityReport = QualityService.evaluate(parserResult.structuredData);

    // 6. Normalization & Persistence
    const duration = Date.now() - startTime;
    
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        rawText: extraction.text,
        isParsed: true,
        parsedAt: new Date(),
        parserVersion: parserResult.parserVersion,
        aiProvider: parserResult.aiProvider,
        confidenceScore: parserResult.confidenceScore,
        processingTimeMs: duration,
        tokensConsumed: parserResult.tokensConsumed,
        structuredData: parserResult.structuredData as any,
        qualityScore: qualityReport.overallScore,
        qualityFeedback: qualityReport.feedback as any,
        processingStatus: 'READY',
        parsingError: null,
      },
    });

    // 7. Job Matching: Compare the parsed resume against all active opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      include: {
        company: true,
        enrichment: true,
      },
    });

    // Compute fits in batches of 50 to save connection pool limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < opportunities.length; i += CHUNK_SIZE) {
      const chunk = opportunities.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (job) => {
          const matchResult = MatchEngine.match(parserResult.structuredData, job);

          return prisma.jobMatch.upsert({
            where: {
              resumeId_opportunityId: {
                resumeId,
                opportunityId: job.id,
              },
            },
            create: {
              resumeId,
              opportunityId: job.id,
              overallScore: matchResult.overallScore,
              skillScore: matchResult.skillScore,
              techScore: matchResult.techScore,
              experienceScore: matchResult.experienceScore,
              locationScore: matchResult.locationScore,
              employmentTypeScore: matchResult.employmentTypeScore,
              missingSkills: matchResult.missingSkills,
              missingTechnologies: matchResult.missingTechnologies,
              niceToHaveSkills: matchResult.niceToHaveSkills,
              strengthAreas: matchResult.strengthAreas,
              improvementSuggestions: matchResult.improvementSuggestions,
              matchExplanation: matchResult.matchExplanation,
            },
            update: {
              overallScore: matchResult.overallScore,
              skillScore: matchResult.skillScore,
              techScore: matchResult.techScore,
              experienceScore: matchResult.experienceScore,
              locationScore: matchResult.locationScore,
              employmentTypeScore: matchResult.employmentTypeScore,
              missingSkills: matchResult.missingSkills,
              missingTechnologies: matchResult.missingTechnologies,
              niceToHaveSkills: matchResult.niceToHaveSkills,
              strengthAreas: matchResult.strengthAreas,
              improvementSuggestions: matchResult.improvementSuggestions,
              matchExplanation: matchResult.matchExplanation,
            },
          });
        })
      );
    }

    // Trigger Career Analysis pipeline automatically
    try {
      await careerAnalysisPipeline.trigger({
        resumeId,
        userId,
      });
    } catch (triggerError) {
      console.warn('Trigger.dev career job dispatch failed, running inline:', triggerError);
      await runCareerAnalysisPipeline({
        resumeId,
        userId,
      });
    }

    return {
      success: true,
      resumeId,
      processingTimeMs: duration,
      confidenceScore: parserResult.confidenceScore,
      qualityScore: qualityReport.overallScore,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`Resume pipeline failed for ID ${resumeId}:`, err);

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsingError: errorMsg,
        isParsed: false,
        processingStatus: 'FAILED',
      },
    });

    throw err;
  }
}

export const resumeParsePipeline = task({
  id: 'resume-parse-pipeline',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: ResumePipelinePayload) => {
    return runResumeParsePipeline(payload);
  },
});
