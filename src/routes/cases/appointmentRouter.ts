import express from "express";
import * as appointmentController from "../../controllers/appointmentController";
import * as caseController from "../../controllers/caseController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]),
    appointmentController.getAppointmentsByClinician); // Get all appointments for a specific clinician
    
router.get("/new", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    caseController.getBookNewAppointmentForm); // Get new appointment page

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    caseController.bookAppointment); // Create new appointment

router.get("/:appointmentId", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN, $Enums.UserRole.PATIENT]), 
    appointmentController.readAppointmentById); // Read appointment by id

router.patch("/:appointmentId/status", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    caseController.acceptOrRejectCase); // Update case status

router.patch("/:appointmentId", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    appointmentController.writeDiagnosis); // Update appointment status


export default router;

