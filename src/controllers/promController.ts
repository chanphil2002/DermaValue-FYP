import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { Question, PromTemplate } from "../@types/types";

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

        console.log(loggedInUserId);

        if (!loggedInUserId) {
            throw createHttpError(401, "User ID is missing or undefined.");
        }
        const { appointmentId } = req.params;
        const { responses } = req.body;

        if (!appointmentId || !responses) {
        throw createHttpError(400, "Appointment ID and responses are required");
        }

        // Check if appointment exists
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
            diagnosis: {
                include: {
                disease: true,
                },
            },
            patient: true,
            clinician: true,
            },
        });

        if (!appointment) {
            throw createHttpError(404, "Appointment not found");
        }

        // Ensure the current user is the patient of this appointment
        if (appointment.patientId !== loggedInUserId.toString()) {
            throw createHttpError(403, "You are not authorized to fill this PROM");
        }

        // Ensure appointment status is "done"
        if (appointment.status !== $Enums.AppointmentStatus.COMPLETED) {
            throw createHttpError(400, "You can only fill PROM after treatment is completed");
        }
        
        // Ensure diagnosis is available
        if (!appointment.diagnosis) {
            throw createHttpError(400, "Diagnosis must be completed before filling PROM");
        }

        // Check if the patient has already submitted a PROM within the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentProm = await prisma.promResponse.findFirst({
            where: {
              appointmentId,
              patientId: loggedInUserId,
              submittedAt: {
                gte: twoWeeksAgo,
              },
            },
          });

        if (recentProm) {
            throw createHttpError(400, "You can only fill PROM every two weeks");
        }
        
        const diagnosis = appointment.diagnosis as unknown as {
            disease: { _id: string; name: string }; // Replace with the actual structure of your Disease model
        };

        // Fetch the PROM template using diseaseId
        const promTemplate = await prisma.prom.findFirst({
            where: { diseaseId: appointment.diagnosis?.disease.id },
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

        // Save the PROM response
        const promResponse = await prisma.promResponse.create({
            data: {
            appointmentId: appointment.id,
            patientId: loggedInUserId,
            clinicianId: appointment.clinicianId,
            promId: promTemplate.id,
            responses: validatedResponses,
            totalScore,
            },
        });
  
      res.status(201).json({ message: "PROM submitted successfully", promResponse});
      
    } catch (error) {
      next(error);
    }
  };
