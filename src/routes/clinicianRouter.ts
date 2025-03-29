import express from "express";
import * as clinicianController from "../controllers/clinicianController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { UserRole } from "../enums/userRole";

const router = express.Router();

router.get("/", authenticateJWT, authorizeRole([UserRole.CLINICIAN]), clinicianController.getClinicians);

router.get("/:id", authenticateJWT, authorizeRole([UserRole.CLINICIAN]), clinicianController.getClinician);

// router.patch<{ id: string }>("/:id", authenticateJWT, ClinicianController.updateClinician);

router.delete("/:id", authenticateJWT, authorizeRole([UserRole.CLINICIAN]), clinicianController.deleteClinician);

export default router;

