import express from "express";
import * as caseController from "../../controllers/caseController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

import appointmentRouter from "./appointmentRouter";
import noteRouter from "./noteRouter";
import promRouter from "./promRouter";

import multer from "multer";
import collaboratorRouter from "./collaboratorRouter";
import { storage } from "../../util/cloudinary/index";

const upload = multer({ storage });

const router = express.Router({ mergeParams: true });
    
router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]),
    caseController.getAllCasesByUsers); // Get all cases for a patient

router.get("/:clinicId/new", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]),
    caseController.getBookNewAppointmentForm); // Get new case page

router.post("/", upload.single('caseImageFile'), authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    caseController.bookAppointment); // Create a new case

router.get("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]), 
    caseController.readCaseById); // Get case details

router.use("/:id/clinic/:clinicId/appointments", appointmentRouter);
router.use("/:id/notes", noteRouter);
router.use("/:id/proms", promRouter);
router.use("/:id/collaborators", collaboratorRouter);

// router.get("/:caseId/notes", getCaseNotes);

// router.get("/:caseId/collaborators", getCaseCollaborators);

export default router;