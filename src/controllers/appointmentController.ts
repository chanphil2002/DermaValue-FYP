import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";

export const bookAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    console.log("Authenticated User:", req.user);
    const { clinician, clinic, date } = req.body;
    const patient = req.user.patientId; // Authenticated user
    console.log(patient);

    if (!clinician || !clinic || !date) {
      throw createHttpError(400, "All fields are required");
    }
    if (!patient) {
      throw createHttpError(400, "Patient ID is required to book an appointment");
    }
    // Create a new appointment using Prisma
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient,
        clinicianId: clinician,
        clinicId: clinic,
        date: new Date(date),
        status: $Enums.AppointmentStatus.PENDING, // Default status
      },
    });

    res.status(201).json({ message: "Appointment booked successfully", appointment });
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
    
    // Find the appointment and include clinician details
    const appointment = await prisma.appointment.findUnique({
      where: { id },
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

    // Ensure the appointment is in 'pending' status
    if (appointment.status !== $Enums.AppointmentStatus.PENDING) {
      throw createHttpError(400, "Appointment is not in pending status");
    }

    // Ensure the clinician is assigned to this appointment
    if (appointment.clinician?.user?.id.toString() !== loggedInUserId.toString()) {
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
