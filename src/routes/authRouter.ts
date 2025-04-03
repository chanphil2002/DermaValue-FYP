import express from "express";
import * as authController from "../controllers/authController";
import { $Enums } from "@prisma/client";
import { authenticateJWT, clearAuthCookie } from "../middleware/auth";

const router = express.Router();

router.get("/login/:role", clearAuthCookie, authController.getLoginPage);

router.post("/login/:role", clearAuthCookie, authController.loginUser);

router.get("/", authenticateJWT, authController.getDashboard);

router.get("/register/:role", clearAuthCookie, authController.getRegisterPage);

router.post("/register/:role", clearAuthCookie, authController.registerUser);

router.get("/logout", clearAuthCookie, authController.logout);

export default router;
