import express from "express";
import * as mdtNoteController from "../../controllers/noteController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), mdtNoteController.createNewMDTNote);

export default router;