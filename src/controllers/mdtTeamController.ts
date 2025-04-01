import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assertHasUser } from "../util/assertHasUser";

export const inviteToMDT: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    
    const { caseId } = req.params;
    const { clinicianIds } = req.body; // Array of clinician IDs to invite
    const loggedInUserId = req.user.clinicianId; // Authenticated clinician

    console.log(caseId);
    console.log(clinicianIds);

    if (!caseId || !clinicianIds || !Array.isArray(clinicianIds) || clinicianIds.length === 0) {
      throw createHttpError(400, "Case ID and clinician IDs are required");
    }

    // Find the case and ensure the logged-in clinician is the primary clinician
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { primaryClinician: true, MDTInvite: true },
    });

    if (!caseData) {
      throw createHttpError(404, "Case not found");
    }

    if (caseData.primaryClinicianId !== loggedInUserId) {
      throw createHttpError(403, "Only the primary clinician can invite MDT members");
    }

    // Filter out already invited clinicians
    const existingMDTClinicianIds = caseData.MDTInvite.map(mdt => mdt.clinicianId);
    const newClinicians = clinicianIds.filter(id => !existingMDTClinicianIds.includes(id));

    if (newClinicians.length === 0) {
      throw createHttpError(400, "All selected clinicians are already part of the MDT");
    }

    // Add clinicians to MDT
    const mdtInvites = await prisma.mDTInvite.createMany({
      data: newClinicians.map(clinicianId => ({
        caseId,
        clinicianId,
      })),
    });

    res.status(201).json({
      message: "MDT members invited successfully",
      invitedClinicians: newClinicians,
    });
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
      throw createHttpError(404, "Case not found");
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
