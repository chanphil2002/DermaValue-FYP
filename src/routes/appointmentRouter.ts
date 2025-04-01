import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    appointmentController.bookAppointment); // Create a new appointment

router.get("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.getAppointment); // Update appointment status

router.patch("/:id/status", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.acceptOrRejectAppointment); // Update appointment status

router.patch("/:id/diagnosis", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.writeDiagnosis); // Update appointment status

export default router;