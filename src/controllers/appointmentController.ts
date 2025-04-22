import createHttpError from "http-errors";
import { assertHasUser } from "../util/assertHasUser";
import { RequestHandler } from "express";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { oauth2Client, listEvents } from '../util/google-calendar'; // Adjust path as needed

// Redirect user to Google login
export const googleLogin: RequestHandler = (req, res, next) => {
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'openid',
    'profile',
    'email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  res.redirect(url);
};

// Handle callback
export const googleCallback: RequestHandler = async (req, res, next) => {
  const code = req.query.code as string;

  // Exchange the code for tokens
  const { tokens } = await oauth2Client.getToken({
    code, redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
  });
  
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email || !profile.name || !profile.picture) {
    throw new Error("Required profile information is missing");
  }

  const userEmail = profile.email;

  // Save or update the user profile in your database
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    res.redirect("/login");
    return;
  }

  user = await prisma.user.update({
    where: { email: userEmail },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });

  // Construct the JWT payload dynamically based on the role
  const payload: Record<string, any> = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    profileImageUrl: user.profileImageUrl
  };
 
  const jwtToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // Set the cookie
  res.cookie('token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.redirect('/appointments/calendar/events');
};

export const getOAuth2Client = async (userEmail: string): Promise<OAuth2Client> => {
  // Get user data from the database using email or userId
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the token has expired
  const currentTime = new Date();
  if (user.googleTokenExpiresAt && user.googleTokenExpiresAt < currentTime) {
    // If the token has expired, use the refresh token to get a new access token
    const response = await oauth2Client.refreshAccessToken();
    const tokens = response.credentials;

    const expirationTime = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Update the database with the new tokens
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiresAt: expirationTime,
      },
    });
  } else {
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
  }

  return oauth2Client;
};

export const listUserCalendarEvents: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;

    const oauth2Client = await getOAuth2Client(req.user.email);

    // Call listEvents with OAuth2Client
    const events = await listEvents(oauth2Client);

    res.render("appointments/new", {events, user});

  } catch (error) {
    next(error);  // Forward error to the error handling middleware
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
    const { caseId, clinicianId, date, description } = req.body;
    console.log("Creating appointment with data:", description);

    // Patients can only create appointments for themselves
    const patientId = user.role === "PATIENT" ? user.id : req.body.patientId;

    const appointment = await prisma.appointment.create({
      data: {
        caseId,
        clinicianId,
        patientId,
        date,
        description
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
  
      res.redirect(`/cases/${appointment.caseId}/appointments/${appointmentId}`); // Redirect to the appointment details page
  
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