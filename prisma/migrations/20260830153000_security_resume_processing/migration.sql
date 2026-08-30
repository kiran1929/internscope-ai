-- AlterTable
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "processingStatus" TEXT NOT NULL DEFAULT 'UPLOADING';
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Resume_userId_isCurrentVersion_idx" ON "Resume"("userId", "isCurrentVersion");
CREATE INDEX IF NOT EXISTS "Resume_processingStatus_idx" ON "Resume"("processingStatus");

-- CreateIndex (dedupe notifications per user/opportunity)
CREATE UNIQUE INDEX IF NOT EXISTS "user_opportunity_notification" ON "EmailNotification"("userId", "opportunityId");

-- CreateIndex (cover letter version uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS "cover_letter_version_unique" ON "CoverLetterVersion"("coverLetterId", "version");
