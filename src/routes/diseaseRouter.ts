import express from "express";
import * as diseaseController from "../controllers/diseaseController";
import { authenticateJWT, authorizeRole } from "../middleware/auth";
import { $Enums } from "@prisma/client";
import multer from "multer";
import { storage } from "../util/cloudinary/index";

const upload = multer({ storage });

const router = express.Router();

router.get("/new", authenticateJWT, diseaseController.showNewDiseaseFormPage);

router.post("/", authenticateJWT, diseaseController.createNewDisease);

router.patch("/", authenticateJWT, diseaseController.updateDisease);

router.get("/", authenticateJWT, diseaseController.getAllDiseases);

router.route("/:id")
    .all(authenticateJWT)
    .get(diseaseController.getEditDiseaseFormById)
    .patch(diseaseController.updateDisease)
    .delete(diseaseController.deleteDisease);

export default router;
