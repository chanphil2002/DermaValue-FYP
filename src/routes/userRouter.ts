import express from "express";
import * as userController from "../controllers/userController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.post("/upload", authenticateJWT, authorizeRole([$Enums.UserRole.PATIENT]),
    userController.uploadHandler); // Upload image

export default router;