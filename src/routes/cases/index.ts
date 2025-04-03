import express from "express";
import * as caseController from "../../controllers/caseController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

import appointmentRouter from "./appointmentRouter";
import noteRouter from "./noteRouter";
import promRouter from "./promRouter";
import collaboratorRouter from "./collaboratorRouter";

const router = express.Router({ mergeParams: true });

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]),
    caseController.getAllCasesByUsers); // Get all cases for a patient

router.get("/new", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]),
    caseController.getNewCaseForm); // Get new case page

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    caseController.createCase); // Create a new case

router.get("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]), 
    caseController.readCaseById); // Get case details

router.patch("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    caseController.acceptOrRejectCase); // Update case status

router.use("/:id/appointments", appointmentRouter);
router.use("/:id/notes", noteRouter);
router.use("/:id/proms", promRouter);
router.use("/:id/collaborators", collaboratorRouter);

// router.get("/:caseId/notes", getCaseNotes);

// router.get("/:caseId/collaborators", getCaseCollaborators);

export default router;