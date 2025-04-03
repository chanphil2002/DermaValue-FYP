import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assertHasUser } from "../util/assertHasUser";

export const readMDTNote: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const caseId = req.params.id; // Get the case ID from the URL parameter
    const user = req.user; // Ensure user is authenticated

    // Ensure user is a clinician
    if (user.role !== "CLINICIAN") {
      res.status(403).json({ success: false, message: "Unauthorized access" });
      return;
    }

    // Fetch the case and its MDT notes
    const caseWithNotes = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        MDTNote: true, // Include MDT notes related to the case
      },
    });

    if (!caseWithNotes) {
      res.status(404).json({ success: false, message: "Case not found" });
      return;
    }

    // Return the MDT notes for this case
    res.status(200).json({ success: true, data: caseWithNotes.MDTNote });

  } catch (error) {
    next(error);
  }
};

// Add a note to a case
export const createNewMDTNote: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    console.log(req.body);
    
    const { id } = req.params;
    const { note } = req.body;

    const loggedInClinicianId = req.user.clinicianId; // Authenticated clinician

    if (!id || !note) {
      throw createHttpError(400, "Case ID and note are required");
    }

    // Check if the clinician is part of the MDT
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        MDTNote: true,
        MDTInvite: true,
        primaryClinician: true,
      },
    });

    if (!caseData) {
      throw createHttpError(404, "Case not found");
    }

    const isAuthorizedClinician =
      caseData.primaryClinicianId === loggedInClinicianId ||
      caseData.MDTInvite.some(mdt => mdt.clinicianId === loggedInClinicianId);

    if (!isAuthorizedClinician) {
      throw createHttpError(403, "You are not authorized to log notes for this case");
    }

    if (!loggedInClinicianId) {
    throw createHttpError(400, "Clinician ID is required to log an MDT note");
    }
    
    // Add the note
    const caseNote = await prisma.mDTNote.create({
      data: {
        caseId: id,
        clinicianId: loggedInClinicianId,
        content: note,
      },
    });

    res.status(201).redirect(`/cases/${id}`); // Redirect to the case details page after adding the note
  } catch (error) {
    next(error);
  }
};

// Get all notes for a case
export const getCaseNotes: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { caseId } = req.params;

    // Fetch case notes along with clinician details
    const caseNotes = await prisma.mDTNote.findMany({
      where: { caseId },
      include: {
        clinician: {
          include: {
            user: true, // Get clinician's user details (name, email, etc.)
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Show newest notes first
    });

    if (!caseNotes.length) {
      throw createHttpError(404, "No notes found for this case");
    }

    res.status(200).json({
      caseId,
      notes: caseNotes.map(note => ({
        noteId: note.id,
        clinicianId: note.clinicianId,
        clinicianName: note.clinician.user.username,
        note: note.content,
        timestamp: note.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};
