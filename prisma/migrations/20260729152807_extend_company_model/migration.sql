-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "careerPageUrl" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companySize" TEXT DEFAULT '1-10',
ADD COLUMN     "country" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "hiringStatus" TEXT NOT NULL DEFAULT 'HIRING',
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twitterUrl" TEXT;

-- CreateIndex
CREATE INDEX "Company_websiteUrl_idx" ON "Company"("websiteUrl");

-- CreateIndex
CREATE INDEX "Company_linkedinUrl_idx" ON "Company"("linkedinUrl");

-- CreateIndex
CREATE INDEX "Company_careerPageUrl_idx" ON "Company"("careerPageUrl");

-- CreateIndex
CREATE INDEX "Company_isArchived_idx" ON "Company"("isArchived");
