-- DropForeignKey
ALTER TABLE "PromResponse" DROP CONSTRAINT "PromResponse_caseId_fkey";

-- AddForeignKey
ALTER TABLE "PromResponse" ADD CONSTRAINT "PromResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
