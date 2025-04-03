import express from "express";
import * as promController from "../../controllers/promController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/new", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    promController.getFillNewPromForm);

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]), 
    promController.fillProm);

router.get("/:promId", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]), 
    promController.readPromById);

// router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.ADMIN]), 
//     promController.submitNewProm);

export default router;

