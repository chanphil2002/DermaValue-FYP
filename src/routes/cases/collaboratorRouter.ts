import express from "express";
import * as collaboratorController from "../../controllers/collaboratorController";
import { authenticateJWT, authorizeRole } from "../../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router({ mergeParams: true });

router.get("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    collaboratorController.readAllCollaborators);

router.get("/new", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    collaboratorController.getNewCollaboratorForm);

router.post("/", authenticateJWT, authorizeRole([$Enums.UserRole.CLINICIAN]), 
    collaboratorController.createNewCollaborator);

export default router;