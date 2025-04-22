import express from "express";
import * as clinicianController from "../controllers/clinicianController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";

const router = express.Router();

router.get("/", authenticateJWT, clinicianController.getClinicians);

router.get("/:id", authenticateJWT, clinicianController.getClinician);

router.patch<{ id: string }>("/:id", authenticateJWT, clinicianController.updateClinician);

router.delete("/:id", authenticateJWT, clinicianController.deleteClinician);

export default router;

