import { RequestHandler } from "express";
import createHttpError from "http-errors";
import Appointment from "../models/appointment";
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
