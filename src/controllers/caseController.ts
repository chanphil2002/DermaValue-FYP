import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { getOAuth2Client } from "./appointmentController";
import { listEvents } from "../util/google-calendar";

export const getAllCasesByUsers: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cases;

    if (user.role === "PATIENT") {
      if (!user.patientId) {
        throw createHttpError(400, "Patient ID is required to fetch cases");
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
        throw createHttpError(400, "Clinician ID is required to fetch cases");
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
      throw createHttpError(403, "Unauthorized role");
    }

    const casesWithNewFlag = cases.map(c => ({
      ...c,
      isNew: c.updatedAt ? c.updatedAt > oneDayAgo : false,
    }));

    res.render("cases/index", { title: "Cases", cases: casesWithNewFlag, user });
  } catch (error) {
    next(error);
  }
}

export const getNewCaseForm : RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const clinicId = req.params.clinicId; // Assuming the clinic ID is passed in the URL

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        clinicians: { include: { user: true } }
      },
    });

    // Loop through clinicians and get availability for each
    if (!clinic) {
      throw createHttpError(404, "Clinic not found");
    }

    const diseases = await prisma.disease.findMany();

    res.render("cases/new", 
      { title: "Create Appointment", 
        user, 
        clinic, 
        diseases
      });
  } catch (error) {
    next(error);
  }
}

export const createCase: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { clinic, date, diseaseId, description } = req.body;
    const patientId = req.user.patientId; // Authenticated user

    const clinician = "274b94a4-d235-47a4-a31f-751c0ef4887a"; // Clinician ID from the form

    console.log(req.body);

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
        description,
        date: new Date(date),
        status: $Enums.AppointmentStatus.PENDING, // Default status
      },
    });

    res.redirect(`/cases/${existingCase.id}`); // Redirect to the case details page
    
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
      throw createHttpError(404, "Appointment not found");
    }

    res.render("cases/show", { title: "Case ID", caseDetails, user });

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

    console.log("Action:", action);

    if (!action || (action !== 'confirm' && action !== 'reject')) {
      throw createHttpError(400, "Invalid action. Action must be 'confirm' or 'reject'.");
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
      where: { id: appointmentId },
      data: {
        status:
          action === 'confirm'
            ? $Enums.AppointmentStatus.CONFIRMED
            : $Enums.AppointmentStatus.CANCELLED,
      },
    });

    res.status(200).redirect(`/cases/${id}`); // Redirect to the case details page

  } catch (error) {
    next(error);
  }
}
