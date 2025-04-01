/*
  Warnings:

  - A unique constraint covering the columns `[caseId,submittedAt]` on the table `PromResponse` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PromResponse_caseId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PromResponse_caseId_submittedAt_key" ON "PromResponse"("caseId", "submittedAt");
