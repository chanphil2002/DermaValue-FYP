import prisma from './prisma';

interface CaseRecoveryData {
  clinicId: string;
  diseaseId: string;
  promScore: number;
  treatmentStart: Date;
  treatmentEnd: Date;
  totalCost: number;
}

export async function updateClinicScoreOnRecovery(caseRecoveryData: CaseRecoveryData) {
  try {
    const durationDays = Math.ceil(
      (caseRecoveryData.treatmentEnd.getTime() - caseRecoveryData.treatmentStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    // 2. Update or create ClinicScore record
    const updatedScore = await prisma.clinicScore.upsert({
      where: {
        clinicId_diseaseId: {
          clinicId: caseRecoveryData.clinicId,
          diseaseId: caseRecoveryData.diseaseId
        }
      },
      create: {
        clinicId: caseRecoveryData.clinicId,
        diseaseId: caseRecoveryData.diseaseId,
        totalPromScore: caseRecoveryData.promScore,
        totalCost: caseRecoveryData.totalCost,
        totalDays: durationDays,
        totalCases: 1,
        avgPromScore: caseRecoveryData.promScore,
        avgDays: durationDays,
        avgCost: caseRecoveryData.totalCost
      },
      update: {
        totalPromScore: { increment: caseRecoveryData.promScore },
        totalCost: { increment: caseRecoveryData.totalCost },
        totalDays: { increment: durationDays },
        totalCases: { increment: 1 }
      }
    });

    // Step 2: Fetch the latest updated totals
    const clinicScore = await prisma.clinicScore.findUnique({
      where: { clinicId_diseaseId: { 
        clinicId: caseRecoveryData.clinicId, 
        diseaseId: caseRecoveryData.diseaseId 
      }}
    });

    if (!clinicScore) {
      throw new Error('Failed to retrieve updated ClinicScore');
    }

    // Step 3: Calculate new averages
    const newAvgPromScore = clinicScore.totalPromScore / clinicScore.totalCases;
    const newAvgDays = clinicScore.totalDays / clinicScore.totalCases;
    const newAvgCost = clinicScore.totalCost / clinicScore.totalCases;

    // Step 4: Update averages in a separate call
    await prisma.clinicScore.update({
      where: { clinicId_diseaseId: { 
        clinicId: caseRecoveryData.clinicId, 
        diseaseId: caseRecoveryData.diseaseId 
      }},
      data: {
        avgPromScore: newAvgPromScore,
        avgDays: newAvgDays,
        avgCost: newAvgCost
      }
    });
    
    console.log(`Updated ClinicScore for clinic ${caseRecoveryData.clinicId} and disease ${caseRecoveryData.diseaseId}`);
    return updatedScore;
  } catch (error) {
    console.error('Failed to update ClinicScore:', error);
    throw new Error('ClinicScore update failed');
  }
}