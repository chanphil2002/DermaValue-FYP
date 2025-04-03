import express from "express";
import * as clinicController from "../controllers/clinicController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

router.post("/", clinicController.createClinic);

router.get("/", clinicController.getClinics);

router.get("/index", clinicController.showIndexPage);

router.route("/:id")
    .get(clinicController.getClinicById)
    .patch(clinicController.updateClinic)
    .delete(clinicController.deleteClinic);

export default router;
