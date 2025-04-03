import express from "express";
import * as appointmentController from "../../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/new", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    appointmentController.getNewAppointmentForm); // Get new appointment page

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    appointmentController.createNewAppointment); // Create new appointment

router.get("/:appointmentId", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN, $Enums.UserRole.PATIENT]), 
    appointmentController.readAppointmentById); // Read appointment by id

router.patch("/:appointmentId", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.writeDiagnosis); // Update appointment status

export default router;

