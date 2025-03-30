import { RequestHandler } from "express";
import createHttpError from "http-errors";
import Appointment from "../models/appointment";
import Prom from "../models/prom";
import PromResponse from "../models/promResponse";
import Disease from "../models/disease";
import { assertHasUser } from "../util/assertHasUser";
import { AppointmentStatus } from "../enums/appointmentStatus";

export const addDisease: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);

        const loggedInUserId = req.user.userId;
        const { name } = req.body;

        if (!name) {
        throw createHttpError(400, "Disease name is required.");
        }

        // Check if the disease already exists
        const existingDisease = await Disease.findOne({ name });
        if (existingDisease) {
        throw createHttpError(409, "Disease already exists.");
        }

        // Save new disease
        const newDisease = new Disease({ name });
        await newDisease.save();

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

    const promTemplate = new Prom({
        name, // Save the PROM name
        disease: diseaseId,
        questions,
      });

    await promTemplate.save();

    res.status(201).json({message: "PROM Template created successfully", promTemplate});

  } catch (error) {
    next(error);
  }
};

// Patient fills PROM after treatment
export const fillProm: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);

        const loggedInUserId = req.user.userId;
        const { appointmentId } = req.params;
        const { responses } = req.body;

        if (!appointmentId || !responses) {
        throw createHttpError(400, "Appointment ID and responses are required");
        }

        // Check if appointment exists
        const appointment = await Appointment.findById(appointmentId)
            .populate({
                path: "diagnosis", // Populate the `diagnosis` field
                populate: {
                    path: "disease", // Populate the `disease` field inside `diagnosis`
                    model: "Disease", // Specify the model for the `disease` field
                },
            })
        .exec();

        if (!appointment) {
            throw createHttpError(404, "Appointment not found");
        }

        // Ensure the current user is the patient of this appointment
        if (appointment.patient.toString() !== loggedInUserId.toString()) {
            throw createHttpError(403, "You are not authorized to fill this PROM");
        }

        // Ensure appointment status is "done"
        if (appointment.status !== AppointmentStatus.COMPLETED) {
            throw createHttpError(400, "You can only fill PROM after treatment is completed");
        }
        
        // Ensure diagnosis is available
        if (!appointment.diagnosis) {
            throw createHttpError(400, "Diagnosis must be completed before filling PROM");
        }

        // Check if the patient has already submitted a PROM within the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentProm = await PromResponse.findOne({
            appointment: appointmentId,
            patient: loggedInUserId,
            submittedAt: { $gte: twoWeeksAgo }, // Check if a PROM was submitted within the last two weeks
        });

        if (recentProm) {
            throw createHttpError(400, "You can only fill PROM every two weeks");
        }
        
        const diagnosis = appointment.diagnosis as unknown as {
        disease: { _id: string; name: string }; // Replace with the actual structure of your Disease model
        };

        // Validate that all responses match the PROM questions
        const promTemplate = await Prom.findOne({ disease: diagnosis.disease });

        if (!promTemplate) {
            throw createHttpError(404, "No PROM template found for this disease");
        }

        // Validate that all responses match the PROM questions
        if (responses.length !== promTemplate.questions.length) {
            throw createHttpError(400, "Number of responses must match the PROM questions");
        }

        let totalScore = 0;

        // Map responses to questions
        interface Response {
            score: number;
        }

        interface ValidatedResponse {
            question: string;
            score: number;
        }

        const validatedResponses: ValidatedResponse[] = responses.map((response: Response, index: number) => {
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
        const promResponse = new PromResponse({
            appointment: appointment._id,
            patient: loggedInUserId,
            clinician: appointment.clinician._id,
            prom: promTemplate._id,
            responses: validatedResponses,
            totalScore,
        });

        await promResponse.save();

        // Add the PROM response to the appointment's PROM array
        appointment.prom.push(promResponse._id);
        await appointment.save();
  
      res.status(201).json({ message: "PROM submitted successfully", promResponse});
      
    } catch (error) {
      next(error);
    }
  };
