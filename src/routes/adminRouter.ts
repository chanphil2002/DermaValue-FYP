import express from "express";
import * as adminController from "../controllers/adminController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

router.patch("/approve/:clinicianId", authenticateJWT, adminController.approveClinician);

router.delete("/reject/:clinicianId", authenticateJWT, adminController.rejectClinician);

export default router;
