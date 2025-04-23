import express from "express";
import * as authController from "../controllers/authController";
import { $Enums } from "@prisma/client";
import { authenticateJWT, clearAuthCookie } from "../middleware/auth";

const router = express.Router();

// router.get("/login/:role", clearAuthCookie, authController.getLoginPage);

// router.post("/login/:role", clearAuthCookie, authController.loginUser);

router.get("/", (req, res) => {
    return res.redirect("/clinics");
  });
  
router.get("/login", clearAuthCookie, authController.getLoginPage);

router.post("/login", clearAuthCookie, authController.loginUser);

// router.get("/register/:role", clearAuthCookie, authController.getRegisterPage);

// router.post("/register/:role", clearAuthCookie, authController.registerUser);

router.get("/register/patient", clearAuthCookie, authController.getPatientRegisterPage);

router.get("/register/clinician", clearAuthCookie, authController.getClinicianRegisterPage);

router.post("/register", clearAuthCookie, authController.registerUser);

router.get("/logout", clearAuthCookie, authController.logout);

export default router;
