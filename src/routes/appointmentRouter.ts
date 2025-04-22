import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.get('/auth/google', appointmentController.googleLogin);

router.get('/oauth2callback', appointmentController.googleCallback);

router.get('/calendar/events', authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]),
    appointmentController.listUserCalendarEvents);

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]),
    appointmentController.getAppointmentsByClinician); // Get all appointments for a specific clinician

export default router;