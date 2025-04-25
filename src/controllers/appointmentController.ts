import createHttpError from "http-errors";
import { assertHasUser } from "../util/assertHasUser";
import { RequestHandler } from "express";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { generateAuthUrl, getOAuth2Client, handleGoogleCallback, oauth2Client } from '../util/google-calendar/googleAuth'; // Adjust path as needed
import { listEvents } from '../services/googleCalendarService'; // Adjust path as needed
import { FreeTimeSlot } from "../util/google-calendar/types";

// Redirect user to Google login
export const googleLogin: RequestHandler = (req, res, next) => {
  const url = generateAuthUrl();
  res.redirect(url);
};

// Handle callback
export const googleCallback: RequestHandler = async (req, res, next) => {
  try {
    const { profile, tokens, user } = await handleGoogleCallback(req.query.code as string);

    // Create JWT
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Set cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.redirect('/cases');
  } catch (error) {
    next(error);
  }
};

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
        include: {
          patient: {
            include: {
              user: true
            }
          },
          case: true,
          clinic: true,
        },
      });
    }

    res.status(200).json({ success: true, data: appointments });

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

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: true
          }
        },
        case: {
          include: {
            disease: true,
          }
        },
        clinic: true,
      },
    });

    if (!appointment) {
      res.status(404).json({ success: false, message: "Appointment not found" });
      return;
    }

    console.log("Appointment details:", appointment);

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
      const { appointmentId } = req.params; // Appointment ID
      const { diagnosisDescription, treatmentPlan, price } = req.body;
      const loggedInUserId = req.user.id;
      const parsedPrice = parseFloat(price);
  
      if (!diagnosisDescription || !treatmentPlan) {
        throw createHttpError(400, "Diagnosis and treatment plan are required.");
      }
  
      // Fetch the appointment, including clinician details
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          clinician: {
            include: {
              user: true,
            },
          }, case: true
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
  
      if (!appointment.caseId) {
        throw createHttpError(400, "Case ID is required to update the total price.");
      }
      
      const updatedTotalPrice = await updateCaseTotalPrice(appointment.caseId, parsedPrice);
      
      // Update the appointment with diagnosis and treatment plan
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          diagnosisDescription,
          treatmentPlan,
          price: parsedPrice,
          status: $Enums.AppointmentStatus.COMPLETED, // Mark appointment as completed
        },
      });

      await prisma.case.update({
        where: { id: appointment.caseId ?? undefined },
        data: {
          totalCost: updatedTotalPrice, // Update the case total price
        },
      });
  
      res.redirect(`/cases/${appointment.caseId}/clinic/${appointment.case?.clinicId}/appointments/${appointmentId}`); // Redirect to the appointment details page
  
    } catch (error) {
      next(error);
    }
  };

async function updateCaseTotalPrice(caseId: string, appointmentPrice: number): Promise<number> {
  // Get all completed appointments for the case
  const appointments = await prisma.appointment.findMany({
    where: {
      caseId,
      status: $Enums.AppointmentStatus.COMPLETED, // Only include completed appointments
    },
    select: {
      price: true, // Select only the price of each appointment
    },
  });

  // Sum up the prices of all completed appointments
  const totalPrice = appointments.reduce((acc, appointment) => acc + (appointment.price || 0), 0);

  // Return the updated total price
  return totalPrice + appointmentPrice; // Add the price of the current appointment to the total
}