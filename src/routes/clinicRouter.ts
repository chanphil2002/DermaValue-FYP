import express from "express";
import * as clinicController from "../controllers/clinicController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";
import multer from "multer";
import { storage } from "../util/cloudinary/index";

const upload = multer({ storage });

const router = express.Router();

router.get("/new", authenticateJWT, clinicController.showNewClinicPage);

router.post("/", upload.single('clinicImageFile'), authenticateJWT, clinicController.createClinic);

router.get("/", authenticateJWT, clinicController.getClinics);

router.get("/all", authenticateJWT, clinicController.showIndexPage);

router.route("/:id")
    .all(authenticateJWT)
    .get(clinicController.getClinicById)
    .patch(clinicController.updateClinic)
    .delete(clinicController.deleteClinic);

export default router;
