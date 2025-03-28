import express from "express";
import * as ClinicianController from "../controllers/clinicianController";
import { authenticateJWT } from "../middleware/auth"; // Make sure you import authenticateJWT

const router = express.Router();

// Get all clinicians - only accessible to clinicians
router.get("/", authenticateJWT, ClinicianController.getClinicians);

// Get a single clinician by ID - accessible to clinicians
router.get("/:id", authenticateJWT, ClinicianController.getClinician);

// Create a clinician - only accessible to admins (or whoever you decide)
router.post("/", authenticateJWT, ClinicianController.createClinician);

// Register clinician (pending approval)
router.post("/register", ClinicianController.registerClinician);

// Update a clinician - only accessible to clinicians
router.patch<{ id: string }>("/:id", authenticateJWT, ClinicianController.updateClinician);

// Delete a clinician - only accessible to admins
router.delete("/:id", authenticateJWT, ClinicianController.deleteClinician);

export default router;
