import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]),
    appointmentController.getAppointmentsByClinician); // Get all appointments for a specific clinician


export default router;