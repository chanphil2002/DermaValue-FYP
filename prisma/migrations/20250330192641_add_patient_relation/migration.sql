-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "clinicianId" TEXT,
ADD COLUMN     "patientId" TEXT;
