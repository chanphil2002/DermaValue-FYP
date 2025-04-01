/*
  Warnings:

  - You are about to drop the column `casesHandled` on the `ClinicScore` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `ClinicScore` table. All the data in the column will be lost.
  - You are about to drop the column `totalPromImprovement` on the `ClinicScore` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicScore" DROP COLUMN "casesHandled",
DROP COLUMN "score",
DROP COLUMN "totalPromImprovement",
ADD COLUMN     "avgCost" DOUBLE PRECISION,
ADD COLUMN     "avgDays" DOUBLE PRECISION,
ADD COLUMN     "avgPromScore" DOUBLE PRECISION,
ADD COLUMN     "totalCases" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPromScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
