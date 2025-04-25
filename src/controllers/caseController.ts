import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums, AppointmentStatus } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { getClinicGoogleCalendarAvailability, listEvents } from "../services/googleCalendarService";
import { uploadAppointmentImage, uploadImage } from '../services/cloudinaryService';
import { FreeTimeSlot } from "../util/google-calendar/types";
import { getOAuth2Client } from "../util/google-calendar/googleAuth";
import { google } from "googleapis";

export const getAllCasesByUsers: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cases;

    if (user.role === "PATIENT") {
      if (!user.patientId) {
        req.flash("error", "Patient ID is required to fetch cases.");
        return res.status(400).redirect("/clinics");
      }

      cases = await prisma.case.findMany({
        where: { patientId: user.patientId }, // Fetch cases where the patient is involved
        orderBy: {
          updatedAt: 'desc', // sort by most recently updated
        },
        include: {
          primaryClinician: { include: { user: true } }, // Include the primary clinician details
          patient: { include: { user: true } },
          disease: true,
          appointments: { include: { clinician: { include: { user: true } } } },
          clinic: true,
        },
      });

    } else if (user.role === "CLINICIAN") {
      if (!user.clinicianId) {
        req.flash("error", "Clinician ID is required to fetch cases.");
        return res.status(400).redirect("/clinics");
      }

      cases = await prisma.case.findMany({
        where: {
          OR: [
            { primaryClinicianId: user.clinicianId }, // Fetch cases where the clinician is the primary
            { MDTInvite: { some: { clinicianId: user.clinicianId } } }, // Fetch cases where the clinician is a collaborator
          ],
        },
        orderBy: {
          updatedAt: 'desc', // sort by most recently updated
        },
        include: {
          patient: { include: { user: true } },
          disease: true,
          appointments: { include: { clinician: { include: { user: true } } } },
          clinic: true,
          primaryClinician: { include: { user: true } }, // Include the primary clinician details
        },
      });
    } else {
      req.flash("error", "Unauthorized role.");
      return res.status(403).redirect("/clinics");
    }

    const casesWithNewFlag = cases.map(c => ({
      ...c,
      isNew: c.updatedAt ? c.updatedAt > oneDayAgo : false,
    }));

    res.render("cases/index", { title: "Cases", cases: casesWithNewFlag, user, messages: res.locals.messages});
  } catch (error) {
    next(error);
  }
}

export const getBookNewAppointmentForm : RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        clinicians: { include: { user: true } } 
       },
    });

    // Loop through clinicians and get availability for each
    if (!clinic) {
      req.flash("error", "Clinic not found.");
      return res.status(404).redirect("/clinics");
    }

    if (clinic.clinicians.length === 0) {
      req.flash("error", "No clinicians found for the selected clinic.");
      return res.redirect("/clinics");
    }

    // Check if the user already has an active case for this clinic
    const existingCase = await prisma.case.findFirst({
      where: {
        patientId: user.patientId ?? undefined,
        clinicId: clinicId,
        isRecovered: false, // Ensure it's an ongoing case
      },
      include: {
        disease: true,
      }
    });

    const diseases = await prisma.disease.findMany();

    const allAvailableSlots = await getClinicGoogleCalendarAvailability(clinic);

    res.render("cases/new", 
      { title: "Create Appointment", 
        user, 
        clinic, 
        diseases,
        events: allAvailableSlots,
        existingCase
      });
  } catch (error) {
    next(error);
  }
}

export const bookAppointment: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { clinic, datetime, diseaseId, description } = req.body;
    const patientId = req.user.patientId; // Authenticated user
    const image = req.file; // Image file from the form

    // Fetch all clinicians for the clinic
    const clinicians = await prisma.clinician.findMany({
      where: {
        clinicId: clinic,
      },
      include: {
        user: true, // Include the user associated with the clinician
        appointments: true, // Include appointments to check availability
      }
    });

    if (clinicians.length === 0) {
      req.flash("error", "No clinicians available for this clinic.");
      return res.status(400).redirect(`/clinics/${clinic}/cases/new`);
    }

    const clinician = clinicians.reduce((prev, current) => {
      const prevCaseCount = prev.appointments.filter((app) => app.status !== AppointmentStatus.COMPLETED).length;
      const currentCaseCount = current.appointments.filter((app) => app.status !== AppointmentStatus.COMPLETED).length;
      return prevCaseCount <= currentCaseCount ? prev : current;
    });

    if (!clinic || !datetime) {
      req.flash("error", "All fields are required.");
      return res.status(400).redirect(`/clinics/${clinic}/cases/new`);
    }
    
    if (!patientId) {
      req.flash("error", "Patient ID is required.");
      return res.status(400).redirect("/dashboard");
    }

    // Check if the patient already has an open case for the same clinic (active case in this clinic)
    let existingCaseForClinic = await prisma.case.findFirst({
      where: {
        patientId,
        clinicId: clinic, // Check within the same clinic
        isRecovered: false, // Ensure it's not recovered
      },
    });

    // If no active case for the clinic, create a new case
    if (!existingCaseForClinic) {
      // Create a new case
      existingCaseForClinic = await prisma.case.create({
        data: {
          patientId,
          diseaseId,
          clinicId: clinic,
          treatmentStart: new Date(),
          primaryClinicianId: clinician.id, // Assign the clinician as the primary clinician
        },
      });
    }

    // Create a new appointment for the existing case (or newly created case)
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        clinicianId: clinician.id,
        clinicId: clinic,
        caseId: existingCaseForClinic.id, // Use the existing or new case ID
        description,
        date: new Date(datetime),
        status: $Enums.AppointmentStatus.PENDING, // Default status
      },
    });

    // Upload image only after appointment is created
    if (image) {
      try {
        const result = await uploadAppointmentImage(image.path, appointment.id);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            imageUrl: result.optimizeUrl,
            imageId: result.uploadResult.public_id,
          },
        });
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        req.flash("warning", "Appointment created, but image upload failed.");
      }
    }

    // Write event to the clinician's Google Calendar
    const calendar = google.calendar("v3");

    try {
      const authClient = await getOAuth2Client(clinician.user.email); // Function to get the OAuth client for the clinician
      console.log(clinician.user.email);

      const event = {
        summary: `Appointment with Patient ${patientId} - Disease: ${diseaseId}`,
        location: clinic,
        description: description,
        start: {
          dateTime: new Date(datetime).toISOString(), // Ensure ISO string format
          timeZone: "Asia/Kuala_Lumpur", // Adjust timezone as needed
        },
        end: {
          dateTime: new Date(new Date(datetime).getTime() + 30 * 60 * 1000).toISOString(), // 1-hour appointment
          timeZone: "Asia/Kuala_Lumpur",
        },
        attendees: [{ email: clinician.user.email }], // Add clinician as an attendee
      };

      console.log("Event to be added:", event);

      await calendar.events.insert({
        auth: authClient, // Authentication client
        calendarId: 'primary', // The calendar ID (e.g., 'primary' for the default calendar)
        requestBody: event,  // Correct usage of requestBody instead of resource
      });

      console.log("Event added to Google Calendar");

    } catch (calendarError) {
      console.error("Error adding event to Google Calendar:", calendarError);
      console.error("Error details:", JSON.stringify(calendarError, null, 2)); // Log the full error details
      req.flash("warning", "Appointment created, but Google Calendar event creation failed.");
    }

    req.flash('success', 'Successfully booked an appointment!');
    res.redirect(`/cases/${existingCaseForClinic.id}`); // Redirect to the case details page
    
  } catch (error) {
    next(error);
  }
};

export const readCaseById: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const caseId = req.params.id;

    // Find the appointment and include related details
    const caseDetails = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        patient: {
          include: {
            user: true, // Include the user associated with the clinician
          },
        },
        primaryClinician: {
          include: {
            user: true, // Include the user associated with the clinician
          },
        },
        disease: true, // Include the disease associated with the case
        appointments: {
          include: {
            clinician: {
              include: {
                user: true, // Include the user associated with the clinician
              },
            },
            clinic: true  // Include the clinic associated with the appointment
          },
        },
        promResponses: {
          include: {
            prom: true, // Include the PROM associated with the response
          },
        }, // Include the PROM responses associated with the case

        clinic: true, 
        MDTNote: {
          include: {
            clinician: {
              include: {
                user: true,
              }
            }
          }
        }, // Assuming mdtNotes is a related model (adjust accordingly)
        MDTInvite: { // Assuming collaborators is a relation (adjust accordingly)
          include: {
            clinician: {
              include: {
                user: true, // Include the user associated with the clinician
              },
            }, // Include the user details of the collaborators
          },
        },
      },
    });

    if (!caseDetails) {
      req.flash("error", "Case not found");
      return res.status(400).redirect("/cases");
    }

    const clinicClinicians = await prisma.clinician.findMany({
      where: {
        clinicId: caseDetails.clinicId,
      },
      include: {
        user: true,
      },
    });

    const existingMDTClinicianIds = caseDetails.MDTInvite.map(invite => invite.clinicianId);

    const availableClinicians = clinicClinicians.filter(clinician =>
      !existingMDTClinicianIds.includes(clinician.id)
    );

    console.log(caseDetails);

    res.render("cases/show", { title: "Case ID", caseDetails, availableClinicians, user });

  }
  catch (error) {
    next(error);
  }  
}

export const acceptOrRejectCase: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const { id, appointmentId } = req.params;
    const loggedInUserId = req.user.id;
    const action = req.body.action;

    if (!action || (action !== 'confirm' && action !== 'reject')) {
      req.flash("error", "Invalid action. Must be 'confirm' or 'reject'.");
      return res.redirect(`/cases/${id}`);
    }

    // Find the appointment and include related details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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
      req.flash("error", "Appointment not found");
      return res.redirect(`/cases/${id}`);
    }

    // Ensure the appointment is in 'pending' status
    if (appointment.status !== $Enums.AppointmentStatus.PENDING) {
      req.flash("error", "Only pending appointments can be modified");
      return res.redirect(`/cases/${id}`);
    }

    // Ensure the clinician is assigned to this appointment
    if (!appointment.clinician || appointment.clinician.user.id.toString() !== loggedInUserId.toString()) {
      req.flash("error", "You are not authorized to modify this appointment");
      return res.redirect(`/cases/${id}`);
    }

    // Update appointment status based on action
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status:
          action === 'confirm'
            ? $Enums.AppointmentStatus.CONFIRMED
            : $Enums.AppointmentStatus.CANCELLED,
      },
    });

    req.flash("success", `Appointment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully.`);
    res.status(200).redirect(`/cases/${id}`); // Redirect to the case details page

  } catch (error) {
    next(error);
  }
}
