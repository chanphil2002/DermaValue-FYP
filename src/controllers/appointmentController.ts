import { RequestHandler } from "express";
import createHttpError from "http-errors";
import Appointment from "../models/appointment";
import { AppointmentStatus } from "../enums/appointmentStatus";
import { assertHasUser } from "../util/assertHasUser";

export const bookAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    console.log("Authenticated User:", req.user);
    const { clinician, clinic, date } = req.body;
    const patient = req.user.userId; // Authenticated user
    console.log(patient);

    if (!clinician || !clinic || !date) {
      throw createHttpError(400, "All fields are required");
    }

    const appointment = new Appointment({
      patient,
      clinician,
      clinic,
      date,
      status: "pending"
    });

    await appointment.save();
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

    // Find appointment and populate clinician, which in turn populates the user
    const appointment = await Appointment.findById(appointmentId)
    .populate({
      path: "clinician",
      populate: {
        path: "user",
        model: "User",
      },
    })
    .exec();

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

    if (!action || (action !== 'accept' && action !== 'reject')) {
      throw createHttpError(400, "Invalid action. Action must be 'accept' or 'reject'.");
    }
    
    const appointment = await Appointment.findById(id).populate("clinician");

    if (!appointment) {
      throw createHttpError(404, "Appointment not found");
    }

    // Ensure the appointment is in 'pending' status
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw createHttpError(400, "Appointment is not in pending status");
    }

    // Ensure the clinician is assigned to this appointment
    if (appointment.clinician.user._id.toString() !== loggedInUserId.toString()) {
      throw createHttpError(403, "You are not authorized to accept this appointment");
    }

    // Update appointment status based on action
    if (action === 'accept') {
      appointment.status = AppointmentStatus.APPROVED;
    } else if (action === 'reject') {
      appointment.status = AppointmentStatus.REJECTED;
    }

    // Save the updated appointment
    await appointment.save();

    res.status(200).json({
      message: "Appointment accepted successfully",
      appointment,
    });

  } catch (error) {
    next(error);
  }
}
