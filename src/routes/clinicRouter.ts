import express from "express";
import * as ClinicController from "../controllers/clinicController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

router.post("/", ClinicController.createClinic);

router.get("/", ClinicController.getClinics);

router.get("/:id", ClinicController.getClinicById);

router.patch("/:id", authenticateJWT, ClinicController.updateClinic);

router.delete("/:id", authenticateJWT, ClinicController.deleteClinic);

export default router;
