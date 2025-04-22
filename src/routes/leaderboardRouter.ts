import express from "express";
import * as leaderboardController from "../controllers/leaderboardController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";
import multer from "multer";
import { storage } from "../util/cloudinary/index";

const upload = multer({ storage });

const router = express.Router();

router.get("/", authenticateJWT, leaderboardController.leaderboard);

export default router;
