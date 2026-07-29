-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Opportunity_isArchived_idx" ON "Opportunity"("isArchived");
