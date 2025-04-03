import createHttpError from "http-errors";
import { assertHasUser } from "../util/assertHasUser";
import { RequestHandler } from "express";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";

export const getAppointmentsByClinician: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user; // Assuming req.user is populated from JWT middleware
    const { clinicianId } = req.params;

    const appointments = await prisma.appointment.findMany({
      where: { clinicianId },
      include: {
        case: true,
        patient: true,
      },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsByCase: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user; // Assuming req.user is populated from JWT middleware
    const { caseId } = req.params;

    let appointments;
    if (user.role === "PATIENT") {
      appointments = await prisma.appointment.findMany({
        where: { caseId },
        include: { clinician: true, case: true },
      });
    } else if (user.role === "CLINICIAN") {
      appointments = await prisma.appointment.findMany({
        where: { clinicianId: user.id },
        include: { patient: true, case: true },
      });
    }

    res.status(200).json({ success: true, data: appointments });

  } catch (error) {
    next(error);
  }
};

export const getNewAppointmentForm: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user; // Assuming req.user is populated from JWT middleware

    console.log(req.params);

    res.render("appointments/new", { title: "Create Appointment", user});

  } catch (error) {
    next(error);
  }
};

export const createNewAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const { caseId, clinicianId, date, time, reason } = req.body;

    // Patients can only create appointments for themselves
    const patientId = user.role === "PATIENT" ? user.id : req.body.patientId;

    const appointment = await prisma.appointment.create({
      data: {
        caseId,
        clinicianId,
        patientId,
        date,
      },
    });

    res.status(201).json({ success: true, data: appointment });

  } catch (error) {
    next(error);
  }
};

export const readAppointmentById: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const { appointmentId } = req.params;
    const id = req.params.id;
    console.log(id);
    console.log(appointmentId);
    console.log(req.params);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, clinician: true, case: true },
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: "Appointment not found" });
      return;
    }

    // Ensure that only the relevant patient or clinician can access the appointment
    if (
      user.role === "PATIENT" && appointment.patientId !== user.patientId ||
      user.role === "CLINICIAN" && appointment.clinicianId !== user.clinicianId
    ) {
      res.status(403).json({ success: false, message: "Unauthorized access" });
      return;
    }

    res.render("appointments/show", { title: "Appointment Details", appointment, user });

  } catch (error) {
    next(error);
  }
};

export const writeDiagnosis: RequestHandler = async (req, res, next) => {
    try {
      assertHasUser(req);
      const { id } = req.params; // Appointment ID
      const { diagnosisDescription, treatmentPlan } = req.body;
      const loggedInUserId = req.user.id;
  
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