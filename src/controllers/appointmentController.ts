import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";

export const bookAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { clinician, clinic, date, diseaseId } = req.body;
    const patientId = req.user.patientId; // Authenticated user

    if (!clinician || !clinic || !date) {
      throw createHttpError(400, "All fields are required");
    }
    if (!patientId) {
      throw createHttpError(400, "Patient ID is required to book an appointment");
    }

    // Check if the patient already has an open case for the same disease
    let existingCase = await prisma.case.findFirst({
      where: {
        patientId,
        diseaseId,
        clinicId: clinic,
        isRecovered: false, // Ensure it's an ongoing case
      },
    });

    // If no existing case, create a new one
    if (!existingCase) {
      existingCase = await prisma.case.create({
        data: {
          patientId,
          diseaseId,
          clinicId: clinic,
          treatmentStart: new Date(),
          primaryClinicianId: clinician, // Assigning the clinician as the primary clinician
        },
      });
    }

    // Create a new appointment using Prisma
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        clinicianId: clinician,
        clinicId: clinic,
        caseId: existingCase.id,
        date: new Date(date),
        status: $Enums.AppointmentStatus.PENDING, // Default status
      },
    });

    res.status(201).json({ message: "Appointment booked successfully", appointment, case: existingCase });
    
  } catch (error) {
    next(error);
  }
};

// Get the appointment by ID and populate clinician and user
export const getAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const appointmentId = req.params.id;

    // Find the appointment and include clinician and user details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        clinician: {
          include: {
            user: true, // Include the user associated with the clinician
          },
        },
      },
    });

    if (!appointment) {
      throw createHttpError(404, "Appointment not found");
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

export const acceptOrRejectAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const { id } = req.params;
    const loggedInUserId = req.user.userId;
    const action = req.body.action;

    if (!action || (action !== 'confirm' && action !== 'reject')) {
      throw createHttpError(400, "Invalid action. Action must be 'confirm' or 'reject'.");
    }

    // Find the appointment and include related details
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        clinician: {
          include: {
            user: true,
          },
        },
        case: {
          include: {
            disease: true, // Include the disease associated with the case
            patient: {
              include: {
                user: true, // Include patient user details
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw createHttpError(404, "Appointment not found");
    }

    // Ensure the appointment is in 'pending' status
    if (appointment.status !== $Enums.AppointmentStatus.PENDING) {
      throw createHttpError(400, "Appointment is not in pending status");
    }

    // Ensure the clinician is assigned to this appointment
    if (!appointment.clinician || appointment.clinician.user.id.toString() !== loggedInUserId.toString()) {
      throw createHttpError(403, "You are not authorized to accept this appointment");
    }

    // Update appointment status based on action
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status:
          action === 'confirm'
            ? $Enums.AppointmentStatus.CONFIRMED
            : $Enums.AppointmentStatus.CANCELLED,
      },
    });

    res.status(200).json({
      message: `Appointment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`,
      appointment: updatedAppointment,
    });

  } catch (error) {
    next(error);
  }
}

export const writeDiagnosis: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const { id } = req.params; // Appointment ID
    const { diagnosisDescription, treatmentPlan } = req.body;
    const loggedInUserId = req.user.userId;

    if (!diagnosisDescription || !treatmentPlan) {
      throw createHttpError(400, "Diagnosis and treatment plan are required.");
    }

    // Fetch the appointment, including clinician details
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        clinician: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      throw createHttpError(404, "Appointment not found.");
    }

    // Ensure the appointment is confirmed
    if (appointment.status !== $Enums.AppointmentStatus.CONFIRMED) {
      throw createHttpError(400, "Only confirmed appointments can have a diagnosis.");
    }

    // Ensure only the assigned clinician can write the diagnosis
    if (!appointment.clinician || appointment.clinician.user.id.toString() !== loggedInUserId.toString()) {
      throw createHttpError(403, "You are not authorized to write the diagnosis for this appointment.");
    }

    // Update the appointment with diagnosis and treatment plan
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        diagnosisDescription,
        treatmentPlan,
        status: $Enums.AppointmentStatus.COMPLETED, // Mark appointment as completed
      },
    });

    res.status(200).json({
      message: "Diagnosis recorded successfully.",
      appointment: updatedAppointment,
    });

  } catch (error) {
    next(error);
  }
};
