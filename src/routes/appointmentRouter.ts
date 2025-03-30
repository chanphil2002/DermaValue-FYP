import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import * as diagnosisController from "../controllers/diagnosisController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    appointmentController.bookAppointment); // Create a new appointment

router.get("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.getAppointment); // Update appointment status

router.patch("/:id/status", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.acceptOrRejectAppointment); // Update appointment status

router.post("/:id/diagnosis", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    diagnosisController.addDiagnosis); // Add diagnosis to appointment

router.get("/:id/diagnosis", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    diagnosisController.getDiagnosisByAppointment); // Add diagnosis to appointment

export default router;