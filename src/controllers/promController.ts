import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { Question, PromTemplate, QuestionResponse } from "../@types/types";
import { nextTick } from "process";
import { updateClinicScoreOnRecovery } from "../util/calculateScore";

export const addDisease: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);

        const loggedInUserId = req.user.id;
        const { name } = req.body;

        if (!name) {
            req.flash("error", "Disease name is required.");
            return res.status(400).redirect("/diseases/new");
        }

        // Check if the disease already exists
        const existingDisease = await prisma.disease.findUnique({
            where: { name },
        });

        if (existingDisease) {
            req.flash("error", "Disease already exists.");
            return res.status(409).redirect("/diseases/new");
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

  export const readAllProms: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        const user = req.user; // Ensure the user is authenticated
    
        // Ensure user is an admin
        if (user.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Unauthorized access" });
            return;
        }
    
        // Fetch all PROMs from the database
        const allProms = await prisma.promResponse.findMany();
        
        res.status(200).json({ success: true, data: allProms });

        } catch (error) {
            next(error);
        }
  };

export const getCreateNewPromForm: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        const user = req.user;

        // Ensure user is an admin
        if (user.role !== "ADMIN") {
            res.status(403).json({ success: false, message: "Unauthorized access" });
            return;
        }

        // Render the new PROM form
        return res.status(200).render("proms/new");

    } catch (error) {
        next(error);
    }
};

export const getFillNewPromForm: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        console.log(req.params);
        const caseId = req.params.id; // Get the case ID from the URL
        const user = req.user;

        console.log(caseId);

        // Ensure user is an admin
        if (user.role !== "PATIENT") {
            res.status(403).json({ success: false, message: "Unauthorized access" });
            return;
        }

        const selectedCase = await prisma.case.findUnique({
            where: { id: caseId }, // Ensure the case belongs to the patient
            include: { disease: true }, // Include disease details
        });

        if (!selectedCase || !selectedCase.disease) {
            res.status(404).json({ success: false, message: "Case or disease not found" });
            return;
        }

        // Find the PROM form linked to the disease
        const promForm = await prisma.prom.findFirst({
            where: { diseaseId: selectedCase.disease.id }
        });

        if (!promForm) {
            res.status(404).json({ success: false, message: "No PROM form found for this disease" });
            return;
        }

        // Render the PROM form template with parsed questions
        res.status(200).render("proms/new", { 
            user, 
            promForm: { ...promForm }, 
            questions: promForm.questions,
            disease: selectedCase.disease,
            caseId
        });

        console.log(promForm.questions)
        console.log(typeof promForm.questions);

    } catch (error) {
        next(error);
    }
};

export const submitNewProm: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const loggedInUserId = req.user.id;
    const { name, diseaseId, questions } = req.body;
    
    // Validate input
    if (!name || !diseaseId || !questions || !Array.isArray(questions) || questions.length === 0) {
        req.flash("error", "All fields (name, diseaseId, questions) are required.");
        return res.status(400).redirect("/diseases/new");
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
        const { id } = req.params; // Case ID
        const loggedInUserId = req.user.patientId;

        // Convert received data into the desired format
        const formattedResponses = req.body.questions.map((item: QuestionResponse) => ({
            score: parseInt(item.score, 10), // Convert score to a number
            question: item.text, // Store the question text
        }));

        if (!loggedInUserId) {
            req.flash("error", "User ID is missing or undefined.");
            return res.status(401).redirect("/login");
        }

        // Check if appointment exists
        const patientCase = await prisma.case.findUnique({
            where: { id },
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
            req.flash("error", "Case not found");
            return res.status(404).redirect("/cases");
        }

        // Check if case is already recovered
        if (patientCase.isRecovered) { 
            req.flash("error", "Cannot submit PROM - this case is already marked as recovered");
            return res.status(400).redirect(`/cases/${id}`);
        }

        // Ensure the current user is the patient of this appointment
        if (patientCase.patientId !== loggedInUserId.toString()) {
            req.flash("error", "You are not authorized to fill this PROM");
            return res.status(403).redirect(`/cases/${id}`);
        }

        // Ensure the Case has at least one completed appointment
        if (patientCase.appointments.length === 0) {
            req.flash("error", "You can only fill PROM after at least one completed appointment");
            return res.redirect(`/cases/${id}/proms/new`);
        }

        // Ensure diagnosis is available
        const latestAppointment = patientCase.appointments[patientCase.appointments.length - 1];
        if (!latestAppointment.diagnosisDescription) {
            req.flash("error", "Diagnosis must be completed before filling PROM");
            return res.status(404).redirect(`/cases/${id}`);
        }

        // Ensure no duplicate PROM submissions in the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentProm = await prisma.promResponse.findFirst({
            where: {
                id,
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
            req.flash("error", "No PROM template found for this disease");
            return res.status(404).redirect(`/cases/${id}`);
        }

        // Validate that all responses match the PROM questions
        if (formattedResponses.length !== promTemplate.questions.length) {
            req.flash("error", "Number of responses must match the PROM questions");
            return res.status(400).redirect(`/cases/${id}`);
        }

        let totalScore = 0;

        // Map responses to questions
        const validatedResponses = formattedResponses.map((response: { score: number }, index: number) => {
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
                where: { id },
                data: {
                    promStart: totalScore,
                    treatmentStart: new Date()
                }
            });
        }

        let recoveryStatus;

        if (patientCase.promResponses.length >= 1) { // Current submission makes it at least 2
            recoveryStatus = await evaluateRecovery(id);
        } else {
            recoveryStatus = { 
                message: "First PROM recorded - recovery evaluation requires at least 2 PROMs",
                isFirstProm: true
            }; 
        }

        req.flash("success", "PROM submitted successfully!");
        res.status(201).redirect(`/cases/${id}`); // Redirect to the case page after successful submission
      
    } catch (error) {
      next(error);
    }
  };


  export const readPromById: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        const promId = req.params.promId; // Get the PROM ID from the URL
        const user = req.user; // Ensure the user is authenticated
  
        // Fetch the PROM data by ID
        const prom = await prisma.promResponse.findUnique({
            where: { id: promId, caseId: req.params.id }, // Ensure the case ID matches
            include: {
                prom: true,
            },
        });
  
        if (!prom) {
            res.status(404).json({ success: false, message: "PROM not found" });
            return;
        }

        console.log(prom);
  
        // Return the PROM data for the patient
        res.render("proms/show", { prom: { ...prom }, user });

        } catch (error) {
            next(error);
        }
    };


// Evaluate recovery status for a case
async function evaluateRecovery(caseId: string) {
    try {
        const patientCase = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                promResponses: {
                    orderBy: { submittedAt: 'desc' }
                },
                disease: {
                    select: {
                        recoveryThreshold: true,
                        expectedMaxScoreChangeRate: true,
                    }
                }
            },
        });

        if (!patientCase) return { error: "Case not found" };
        if (patientCase.isRecovered) {
            console.log("Already recovered");
            return { isRecovered: true, message: "Already recovered" };
        }

        const { promResponses, disease } = patientCase;

        if (!disease?.recoveryThreshold || !disease?.expectedMaxScoreChangeRate) {
            return { error: "Disease recovery settings missing" };
        }

        if (promResponses.length < 2) {
            return { error: "Not enough PROM responses to evaluate" };
        }

        const latestScore = promResponses[0].totalScore;
        const previousScore = patientCase.promStart;

        console.log("Latest score:", latestScore, "Previous score:", previousScore);

        console.log("Recovery threshold:", disease.recoveryThreshold);
        
        const isRecovered = latestScore <= disease.recoveryThreshold;

        console.log("Is recovered:", isRecovered);

        if (isRecovered) {
            const updatedCase = await calculateCaseScore({
                caseId,
                promStart: previousScore ?? 0,
                promEnd: latestScore,
                expectedMaxScoreChangeRate: disease.expectedMaxScoreChangeRate
            });

            if (!updatedCase) {
                return { error: "Error calculating case score" };
            }

            console.log("Newly recovered", latestScore, previousScore);

            await updateClinicScoreOnRecovery({
                clinicId: updatedCase.clinicId,
                diseaseId: updatedCase.diseaseId,
                promScore: updatedCase.caseScore ?? 0,
                treatmentStart: updatedCase.treatmentStart,
                treatmentEnd: updatedCase.treatmentEnd ?? new Date(),
                totalCost: updatedCase.totalCost,
            });

            return {
                isRecovered: true,
                message: "Newly recovered",
                scores: { latest: latestScore, previous: previousScore }
            };
        } else {
            console.log("Not recovered yet", latestScore, previousScore);
            return {
                isRecovered: false,
                message: "Not recovered yet",
                scores: { latest: latestScore, previous: previousScore }
            };
        }
    } catch (error) {
        console.error("Error evaluating recovery:", error);
        return { error: "Internal error" };
    }
}

// Calculate and update case score
async function calculateCaseScore(params: {
    caseId: string,
    promStart: number,
    promEnd: number,
    expectedMaxScoreChangeRate: number
}) {
    const { caseId, promStart, promEnd, expectedMaxScoreChangeRate } = params;

    try {
        console.log("Calculating case score for case:", caseId);

        const patientCase = await prisma.case.findUnique({
            where: { id: caseId },
            select: {
                totalCost: true,
                treatmentStart: true,
                treatmentEnd: true,
            }
        });

        if (!patientCase) {
            throw new Error("Case not found");
        }

        const { totalCost, treatmentStart, treatmentEnd } = patientCase;

        if (!totalCost || !treatmentStart) {
            throw new Error("Missing cost or treatment start date");
        }

        const endDate = treatmentEnd || new Date();
        await prisma.case.update({
            where: { id: caseId },
            data: { treatmentEnd: endDate }
        });

        const durationRecovered = Math.max(
            Math.ceil((endDate.getTime() - treatmentStart.getTime()) / (1000 * 60 * 60 * 24)),
            1 // at least 1 day
        );

        console.log("Duration recovered in days:", durationRecovered);
        console.log("Total cost:", totalCost);
        console.log("PROM start score:", promStart);
        console.log("PROM end score:", promEnd);
        console.log("Expected max score change rate:", expectedMaxScoreChangeRate);

        const rawCaseScore = ((promStart - promEnd) / totalCost) * durationRecovered;
        const normalizedScore = Math.min(
            (rawCaseScore / expectedMaxScoreChangeRate) * 100,
            100
        );

        const updatedCase = await prisma.case.update({
            where: { id: caseId },
            data: {
                isRecovered: true,
                caseScore: normalizedScore,
                promEnd: promEnd
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

        console.log(`Case score calculated for case ${caseId}: ${normalizedScore}`);
        return updatedCase;

    } catch (error) {
        console.error("Error calculating case score:", error);
        return null;
    }
}
  