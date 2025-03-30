import express from "express";
import * as authController from "../controllers/authController";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.post("/register", authController.registerUser);

router.post("/login/clinician", authController.loginUser($Enums.UserRole.CLINICIAN));

router.post("/login/patient", authController.loginUser($Enums.UserRole.PATIENT));

router.post("/login/admin", authController.loginUser($Enums.UserRole.ADMIN));

export default router;
