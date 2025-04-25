import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assertHasUser } from "../util/assertHasUser";

export const readAllCollaborators: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user; // Assuming req.user is populated from JWT middleware

    // Ensure the user is a clinician
    if (user.role !== "CLINICIAN") {
      res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Fetch the case and its collaborators
    const caseWithCollaborators = await prisma.case.findUnique({
      where: { id: req.params.caseId },
      include: {
        MDTInvite: true, // Include collaborators related to the case
      },
    });

    if (!caseWithCollaborators) {
      res.status(404).json({ success: false, message: "Case not found" });
      return;
    }

    res.status(200).json({ success: true, data: caseWithCollaborators.MDTInvite });

  } catch (error) {
    next(error);
  }
};

export const getNewCollaboratorForm: RequestHandler = async (req, res, next) => {
  try {
    const caseId = req.params.id; // Get the case ID from URL
    res.render("collaborators/new", { title: "Add New Collaborator", caseId });

  } catch (error) {
    next(error);
  }
};

export const createNewCollaborator: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { id } = req.params;
    const { clinicianId } = req.body;
    const loggedInUserId = req.user.clinicianId;

    if (!id || !clinicianId) {
      req.flash("error", "Case ID and clinician ID are required.");
      return res.status(400).redirect(`/cases/${id}`);
    }

    // Find the case and ensure the logged-in user is the primary clinician
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        primaryClinician: true,
        MDTInvite: true,
      },
    });

    if (!caseData) {
      req.flash("error", "Case not found.");
      return res.status(404).redirect("/cases");
    }

    if (caseData.primaryClinicianId !== loggedInUserId) {
      req.flash("error", "Only the primary clinician can invite collaborators.");
      return res.status(403).redirect(`/cases/${id}`);
    }

    // Prevent duplicate invite
    const alreadyInvited = caseData.MDTInvite.some(
      (mdt) => mdt.clinicianId === clinicianId
    );

    if (alreadyInvited) {
      req.flash("error", "This clinician has already been invited.");
      return res.redirect(`/cases/${id}`);
    }

    // Invite the clinician
    await prisma.mDTInvite.create({
      data: {
        caseId: id,
        clinicianId,
      },
    });

    req.flash("success", "Clinician invited successfully.");
    return res.redirect(`/cases/${id}`);
  } catch (error) {
    next(error);
  }
};


// Get MDT members for a case
export const getMDTMembers: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);

    const { caseId } = req.params;

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        MDTInvite: {
          include: {
            clinician: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!caseData) {
      req.flash("error", "Case not found");
      return res.status(404).redirect("/cases");
    }

    res.status(200).json({
      caseId: caseData.id,
      primaryClinician: caseData.primaryClinicianId,
      mdtMembers: caseData.MDTInvite.map(mdt => ({
        clinicianId: mdt.clinician.id,
        name: mdt.clinician.user.username,
      })),
    });
  } catch (error) {
    next(error);
  }
};
