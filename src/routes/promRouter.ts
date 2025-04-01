import express from "express";
import * as promController from "../controllers/promController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.post("/addDisease", authenticateJWT, authorizeRole([$Enums.UserRole.ADMIN]), promController.addDisease);

router.post("/addPROM", authenticateJWT, authorizeRole([$Enums.UserRole.ADMIN]), promController.createProm);

router.post("/fillProm/:caseId", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), promController.fillProm);

export default router;

