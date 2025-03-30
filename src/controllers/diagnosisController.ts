import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";

// Add Diagnosis to Appointment
export const addDiagnosis: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    
    const { id } = req.params; // Appointment ID from URL params
    const loggedInUserId = req.user.userId;
    const { disease, description, treatmentPlan } = req.body; // Diagnosis and treatment plan from request body

    // Validate input
    if (!disease || !description || !treatmentPlan) {
      throw createHttpError(400, "Diagnosis and treatment plan are required");
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        clinician: {
          include: {
            user: true, // Include associated user details
          },
        },
      },
    });

    if (!appointment) {
      throw createHttpError(404, "Appointment not found");
    }

    // Check if the clinician is authorized to add the diagnosis
    if (appointment.clinician?.user?.id.toString() !== loggedInUserId.toString()) {
      throw createHttpError(403, "You are not authorized to add diagnosis for this appointment");
    }

    // Check if a diagnosis already exists for this appointment
    const existingDiagnosis = await prisma.diagnosis.findUnique({
      where: { appointmentId: id },
    });

    if (existingDiagnosis) {
      throw createHttpError(409, "Diagnosis already exists for this appointment");
    }

    // Validate if disease exists in the database
    const diseaseExists = await prisma.disease.findUnique({
      where: { id: disease },
    });

    if (!diseaseExists) {
      throw createHttpError(404, "Specified disease not found");
    }

    // Create the diagnosis record
    const diagnosisRecord = await prisma.diagnosis.create({
      data: {
        appointmentId: appointment.id,
        clinicianId: appointment.clinician.id,
        diseaseId: disease,
        description,
        treatmentPlan,
      },
    });

    // Update the appointment with the diagnosis ID
    await prisma.appointment.update({
      where: { id },
      data: {
        diagnosis: {
          connect: { id: diagnosisRecord.id }, // Connect the diagnosis by its ID
        },
      },
    });

    res.status(201).json({ message: "Diagnosis added successfully", diagnosis: diagnosisRecord });
  } catch (error) {
    next(error);
  }
};

export const getDiagnosisByAppointment: RequestHandler = async (req, res, next) => {
    try {
      const { appointmentId } = req.params;
  
      const diagnosis = await prisma.diagnosis.findUnique({
        where: { appointmentId },
        include: {
          clinician: {
            include: {
              user: true, // Include associated user details
            },
          },
        },
      });
  
      if (!diagnosis) {
        throw createHttpError(404, "No diagnosis found for this appointment");
      }
  
      res.status(200).json(diagnosis);
    } catch (error) {
      next(error);
    }
  };


  export const updateDiagnosis: RequestHandler = async (req, res, next) => {
    try {
    assertHasUser(req);
      const { diagnosisId } = req.params;
      const { diagnosis, treatmentPlan, disease } = req.body;
  
      // Find the existing diagnosis
      const existingDiagnosis = await prisma.diagnosis.findUnique({
        where: { id: diagnosisId },
        include: {
          clinician: true,
        },
      });

      if (!existingDiagnosis) {
        throw createHttpError(404, "Diagnosis not found");
      }
  
      // Ensure only the assigned clinician can update the diagnosis
      if (existingDiagnosis.clinician.toString() !== req.user?.userId.toString()) {
        throw createHttpError(403, "You are not authorized to update this diagnosis");
      }
  
      // Update the diagnosis
      const updatedDiagnosis = await prisma.diagnosis.update({
        where: { id: diagnosisId },
        data: {
          diseaseId: disease || existingDiagnosis.diseaseId,
          treatmentPlan: treatmentPlan || existingDiagnosis.treatmentPlan,
        },
      });
  
      res.status(200).json({ message: "Diagnosis updated successfully", diagnosis: existingDiagnosis });
    } catch (error) {
      next(error);
    }
  };


