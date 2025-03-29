import express from "express";
import * as authController from "../controllers/authController";
import { UserRole } from "../enums/userRole";

const router = express.Router();

router.post("/register", authController.registerUser);

router.post("/login/clinician", authController.loginUser(UserRole.CLINICIAN));

router.post("/login/patient", authController.loginUser(UserRole.PATIENT));

export default router;
