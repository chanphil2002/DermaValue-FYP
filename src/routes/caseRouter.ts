import express from "express";
import * as mdtTeamController from "../controllers/mdtTeamController";
import * as mdtNoteController from "../controllers/mdtNoteController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

// router.get("/:caseId", getCaseDetails);

// router.patch("/:caseId/status", updateCaseStatus);

router.post("/:caseId/notes", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), mdtNoteController.addCaseNote);

// router.get("/:caseId/notes", getCaseNotes);

router.post("/:caseId/invite", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), mdtTeamController.inviteToMDT);

// router.get("/:caseId/collaborators", getCaseCollaborators);

export default router;