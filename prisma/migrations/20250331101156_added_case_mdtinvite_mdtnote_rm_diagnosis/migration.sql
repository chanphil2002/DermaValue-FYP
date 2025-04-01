/*
  Warnings:

  - You are about to drop the column `appointmentId` on the `PromResponse` table. All the data in the column will be lost.
  - You are about to drop the `Diagnosis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ClinicianToService` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[caseId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[diseaseId]` on the table `Prom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseId]` on the table `PromResponse` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_clinicianId_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_diseaseId_fkey";

-- DropForeignKey
ALTER TABLE "PromResponse" DROP CONSTRAINT "PromResponse_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "_ClinicianToService" DROP CONSTRAINT "_ClinicianToService_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClinicianToService" DROP CONSTRAINT "_ClinicianToService_B_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "caseId" TEXT,
ADD COLUMN     "diagnosisDescription" TEXT,
ADD COLUMN     "treatmentPlan" TEXT;

-- AlterTable
ALTER TABLE "Clinician" ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Unknown';

-- AlterTable
ALTER TABLE "Disease" ADD COLUMN     "promId" TEXT NOT NULL DEFAULT 'default-prom-id';

-- AlterTable
ALTER TABLE "PromResponse" DROP COLUMN "appointmentId",
ADD COLUMN     "caseId" TEXT;

-- DropTable
DROP TABLE "Diagnosis";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "_ClinicianToService";

-- CreateTable
CREATE TABLE "ClinicScore" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "totalPromImprovement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "casesHandled" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ClinicScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promStart" DOUBLE PRECISION,
    "promEnd" DOUBLE PRECISION,
    "treatmentStart" TIMESTAMP(3) NOT NULL,
    "treatmentEnd" TIMESTAMP(3),
    "isRecovered" BOOLEAN NOT NULL DEFAULT false,
    "caseScore" DOUBLE PRECISION,
    "primaryClinicianId" TEXT NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MDTInvite" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MDTInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MDTNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MDTNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MDTInvite_caseId_clinicianId_key" ON "MDTInvite"("caseId", "clinicianId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_caseId_key" ON "Appointment"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Prom_diseaseId_key" ON "Prom"("diseaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PromResponse_caseId_key" ON "PromResponse"("caseId");

-- AddForeignKey
ALTER TABLE "ClinicScore" ADD CONSTRAINT "ClinicScore_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicScore" ADD CONSTRAINT "ClinicScore_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_primaryClinicianId_fkey" FOREIGN KEY ("primaryClinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDTInvite" ADD CONSTRAINT "MDTInvite_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDTInvite" ADD CONSTRAINT "MDTInvite_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDTNote" ADD CONSTRAINT "MDTNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MDTNote" ADD CONSTRAINT "MDTNote_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromResponse" ADD CONSTRAINT "PromResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
