import express from "express";
import * as promController from "../controllers/promController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { UserRole } from "../enums/userRole";

const router = express.Router();

router.post("/addDisease", authenticateJWT, authorizeRole([UserRole.ADMIN]), promController.addDisease);

router.post("/addPROM", authenticateJWT, authorizeRole([UserRole.ADMIN]), promController.createProm);

router.post("/fillProm/:appointmentId", authenticateJWT, authorizeRole([UserRole.PATIENT]), promController.fillProm);

export default router;

