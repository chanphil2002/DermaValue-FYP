import express from "express";
import * as AdminController from "../controllers/adminController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

// Admin approval routes
router.patch("/approve/:clinicianId", authenticateJWT, AdminController.approveClinician);
router.delete("/reject/:clinicianId", authenticateJWT, AdminController.rejectClinician);

export default router;
