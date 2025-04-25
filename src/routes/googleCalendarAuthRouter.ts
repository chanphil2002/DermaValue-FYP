import express from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.get('/auth/google', authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), appointmentController.googleLogin);

router.get('/oauth2callback', authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), appointmentController.googleCallback);

export default router;