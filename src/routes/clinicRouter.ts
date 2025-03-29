import express from "express";
import * as clinicController from "../controllers/clinicController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

router.post("/", clinicController.createClinic);

router.get("/", clinicController.getClinics);

router.get("/:id", clinicController.getClinicById);

router.patch("/:id", clinicController.updateClinic);

router.delete("/:id", clinicController.deleteClinic);

export default router;
