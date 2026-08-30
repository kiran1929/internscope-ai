-- AlterTable
ALTER TABLE "ATSAnalysis" ADD COLUMN "matchedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
