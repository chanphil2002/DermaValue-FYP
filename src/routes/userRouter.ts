import express from "express";
import * as userController from "../controllers/userController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // multer instance with memory storage

const router = express.Router({ mergeParams: true });

router.post("/upload", upload.single('profileImage'), authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]),
    userController.uploadHandler); // Upload image

router.get("/profile/edit", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]),
    userController.getUserProfile); // Get user profile

router.patch("/profile", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT, $Enums.UserRole.CLINICIAN]),
    userController.updateUserProfile); // Update user profile

export default router;