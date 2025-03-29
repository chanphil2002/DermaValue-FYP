import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { UserRole } from "../enums/userRole";

const router = express.Router();

router.post("/", authenticateJWT, authorizeRole([UserRole.PATIENT]), appointmentController.bookAppointment); // Create a new appointment

export default router;