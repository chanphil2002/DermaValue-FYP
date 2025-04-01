-- DropForeignKey
ALTER TABLE "PromResponse" DROP CONSTRAINT "PromResponse_clinicianId_fkey";

-- DropForeignKey
ALTER TABLE "PromResponse" DROP CONSTRAINT "PromResponse_patientId_fkey";

-- DropForeignKey
ALTER TABLE "PromResponse" DROP CONSTRAINT "PromResponse_promId_fkey";

-- AddForeignKey
ALTER TABLE "PromResponse" ADD CONSTRAINT "PromResponse_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromResponse" ADD CONSTRAINT "PromResponse_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromResponse" ADD CONSTRAINT "PromResponse_promId_fkey" FOREIGN KEY ("promId") REFERENCES "Prom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
