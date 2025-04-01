/*
  Warnings:

  - A unique constraint covering the columns `[clinicId,diseaseId]` on the table `ClinicScore` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClinicScore_clinicId_diseaseId_key" ON "ClinicScore"("clinicId", "diseaseId");
