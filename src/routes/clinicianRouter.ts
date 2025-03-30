import express from "express";
import * as clinicianController from "../controllers/clinicianController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), clinicianController.getClinicians);

router.get("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), clinicianController.getClinician);

router.patch<{ id: string }>("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), clinicianController.updateClinician);

router.delete("/:id", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), clinicianController.deleteClinician);

export default router;

