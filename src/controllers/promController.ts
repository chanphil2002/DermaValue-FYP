import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { Question, PromTemplate } from "../@types/types";
import { nextTick } from "process";
import { updateClinicScoreOnRecovery } from "../util/calculateScore";

export const addDisease: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);

        const loggedInUserId = req.user.userId;
        const { name } = req.body;

        if (!name) {
        throw createHttpError(400, "Disease name is required.");
        }

        // Check if the disease already exists
        const existingDisease = await prisma.disease.findUnique({
            where: { name },
        });

        if (existingDisease) {
            throw createHttpError(409, "Disease already exists.");
        }

        // Save new disease
        const newDisease = await prisma.disease.create({
            data: { name },
        });

        res.status(201).json({ message: "Disease added successfully", disease: newDisease });
    } catch (error) {
        next(error);
    }
  };

export const createProm: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const loggedInUserId = req.user.userId;
    const { name, diseaseId, questions } = req.body;

    console.log("Received disease name:", name);
    console.log("Received disease Id:", diseaseId);
    console.log("Received disease Id:", questions);
    
    // Validate input
    if (!name || !diseaseId || !questions || !Array.isArray(questions) || questions.length === 0) {
        throw createHttpError(400, "All fields (name, diseaseId, questions) are required.");
    }

    // Create PROM template
    const promTemplate = await prisma.prom.create({
        data: {
          name,
          diseaseId,
          questions
        },
      });


    res.status(201).json({message: "PROM Template created successfully", promTemplate});

  } catch (error) {
    next(error);
  }
};

// Patient fills PROM after treatment
export const fillProm: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        const loggedInUserId = req.user.patientId;

        if (!loggedInUserId) {
            throw createHttpError(401, "User ID is missing or undefined.");
        }

        const { caseId } = req.params;
        const { responses } = req.body;

        if (!caseId || !responses) {
        throw createHttpError(400, "Appointment ID and responses are required");
        }

        // Check if appointment exists
        const patientCase = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                patient: true,
                appointments: {
                    where: { status: $Enums.AppointmentStatus.COMPLETED }, // Only fetch completed appointments
                },
                disease: true,
                promResponses: true
            },
        });

        if (!patientCase) {
            throw createHttpError(404, "Appointment not found");
        }

        // Check if case is already recovered
        if (patientCase.isRecovered) { 
            throw createHttpError(400, "Cannot submit PROM - this case is already marked as recovered"); 
        }

        // Ensure the current user is the patient of this appointment
        if (patientCase.patientId !== loggedInUserId.toString()) {
            throw createHttpError(403, "You are not authorized to fill this PROM");
        }

        // Ensure the Case has at least one completed appointment
        if (patientCase.appointments.length === 0) {
            throw createHttpError(400, "You can only fill PROM after at least one completed appointment");
        }

        // Ensure diagnosis is available
        const latestAppointment = patientCase.appointments[patientCase.appointments.length - 1];
        if (!latestAppointment.diagnosisDescription) {
            throw createHttpError(400, "Diagnosis must be completed before filling PROM");
        }

        // Ensure no duplicate PROM submissions in the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentProm = await prisma.promResponse.findFirst({
            where: {
                caseId,
                patientId: loggedInUserId,
                submittedAt: {
                    gte: twoWeeksAgo,
                },
            },
          });

        // if (recentProm) {
        //     throw createHttpError(400, "You can only fill PROM every two weeks");
        // }

        // Fetch the PROM template using diseaseId
        const promTemplate = await prisma.prom.findFirst({
            where: { diseaseId: patientCase.disease.id },
        }) as PromTemplate;

        if (!promTemplate) {
            throw createHttpError(404, "No PROM template found for this disease");
        }

        // Validate that all responses match the PROM questions
        if (responses.length !== promTemplate.questions.length) {
            throw createHttpError(400, "Number of responses must match the PROM questions");
        }

        let totalScore = 0;

        // Map responses to questions
        const validatedResponses = responses.map((response: { score: number }, index: number) => {
            if (!promTemplate.questions[index]) {
                throw createHttpError(400, "Invalid question response");
            }
            totalScore += response.score;
            return {
                question: promTemplate.questions[index].questionText,
                score: response.score,
            };
        });

        // Check if this is the first PROM submission
        const isFirstProm = patientCase.promResponses.length === 0;

        // Save the PROM response
        const promResponse = await prisma.promResponse.create({
            data: {
                caseId: patientCase.id,
                patientId: loggedInUserId,
                clinicianId: latestAppointment.clinicianId,
                promId: promTemplate.id,
                responses: validatedResponses,
                totalScore,
            },
        });

        // Update case with initial PROM data if first submission
        if (isFirstProm) {
            await prisma.case.update({
                where: { id: caseId },
                data: {
                    promStart: totalScore,
                    treatmentStart: new Date()
                }
            });
        }

        let recoveryStatus;

        if (patientCase.promResponses.length >= 1) { // Current submission makes it at least 2
            recoveryStatus = await evaluateRecovery(caseId);
        } else {
            recoveryStatus = { 
                message: "First PROM recorded - recovery evaluation requires at least 2 PROMs",
                isFirstProm: true
            };
        }

        res.status(201).json({ 
            message: "PROM submitted successfully", 
            promResponse,
            recoveryStatus
        });
      
    } catch (error) {
      next(error);
    }
  };


  // New helper function (returns data instead of sending responses)
async function evaluateRecovery(caseId: string) {
    try {
        console.log("Evaluating recovery for case:", caseId);

        const patientCase = await prisma.case.findUnique({
            where: { id: caseId },
            include: { 
                promResponses: {
                    orderBy: {
                        submittedAt: 'desc'
                    }
                } 
            },
        });

        if (!patientCase) return { error: "Case not found" };
        if (patientCase.isRecovered) { console.log("Already recovered"); }
        if (patientCase.isRecovered) return { isRecovered: true, message: "Already recovered" };

        // We already know there are at least 2 responses
        const latestScore = patientCase.promResponses[0].totalScore;
        const previousScore = patientCase.promResponses[1].totalScore;

        if (latestScore <= 10 && latestScore < previousScore) {
            // Step 1: Calculate case score and update recovery status
            const updatedCase = await calculateCaseScore(caseId, latestScore);

            console.log(updatedCase, updatedCase.caseScore);

            if (!updatedCase || updatedCase.caseScore === null) {
                return { error: "Error calculating case score" };
            }

            console.log("Newly recovered", latestScore, previousScore);

            // Step 4: Update ClinicScore with the retrieved caseScore (promScore)
            await updateClinicScoreOnRecovery({
                clinicId: updatedCase.clinicId,
                diseaseId: updatedCase.diseaseId,
                promScore: updatedCase.caseScore,  // Use the caseScore as promScore
                treatmentStart: updatedCase.treatmentStart,
                treatmentEnd: updatedCase.treatmentEnd || new Date(),
                totalCost: updatedCase.totalCost || 0
            });

            return { 
                isRecovered: true, 
                message: "Newly recovered", 
                scores: { latest: latestScore, previous: previousScore }
            }
        }

        console.log("Not recovered yet", latestScore, previousScore);

        return {
            isRecovered: false,
            message: "Not recovered yet",
            scores: { latest: latestScore, previous: previousScore }
        };
    } catch (error) {
        console.error("Error evaluating recovery:", error);
        return { error: "Error evaluating recovery status" };
    }
}


export const calculateCaseScore = async (caseId: string, latestPromEnd: number): Promise<any> => {
    try {
        console.log("Calculating case score for case:", caseId);

        // Step 1: Update `promEnd` first
        await prisma.case.update({
            where: { id: caseId },
            data: { promEnd: latestPromEnd },
        });

        // Step 2: Fetch updated case details after setting `promEnd`
        const patientCase = await prisma.case.findUnique({
            where: { id: caseId },
            select: {
                promStart: true,
                promEnd: true,
                totalCost: true,
                treatmentStart: true,
                treatmentEnd: true,
                diseaseId: true,
            },
        });
  
        if (!patientCase) {
            throw new Error("Case not found");
        }
    
        const { promStart, promEnd, totalCost, treatmentStart, treatmentEnd } = patientCase;

        console.log("PROM Start:", promStart);
        console.log("PROM End:", promEnd);
        console.log("treatmentStart:", treatmentStart);
        console.log("treatmentEnd:", treatmentEnd);

        if (promStart === null || promEnd === null || !treatmentStart) {
            throw new Error("Missing data to calculate case score");
        }

        const newTreatmentEnd = treatmentEnd || new Date(); // Use existing end date or set to now
        await prisma.case.update({
            where: { id: caseId },
            data: { treatmentEnd: newTreatmentEnd },
        });
    
        const durationRecovered = Math.ceil(
            (newTreatmentEnd.getTime() - treatmentStart.getTime()) / (1000 * 60 * 60 * 24) // Convert ms to days
        );

        if (durationRecovered <= 0) {
            throw new Error("Invalid recovery duration");
        }
        
        const caseScore = (promStart - promEnd) / totalCost * durationRecovered;

        // Update case with the calculated score and recovery status
        const updatedCase = await prisma.case.update({
            where: { id: caseId },
            data: {
                caseScore,
                isRecovered: true,
                promEnd: latestPromEnd
            },
            select: {
                caseScore: true,
                clinicId: true,
                diseaseId: true,
                treatmentStart: true,
                treatmentEnd: true,
                totalCost: true,
            }
        });

        console.log(`Case score calculated and case marked as recovered for case ${caseId}: ${caseScore}`);

        return updatedCase;

    } catch (error) {
        console.error(`Error calculating case score: ${(error as any).message}`);
        
        return null;
    }
};
  