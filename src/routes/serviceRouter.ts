import express from "express";
import * as serviceController from "../controllers/serviceController";
import { authenticateJWT } from "../middleware/auth";

const router = express.Router();

router.post("/", serviceController.createService); // Create a new service

router.get("/", serviceController.getServices); // Get all services

router.get("/:id", serviceController.getService); // Get a single service by ID

router.patch("/:id", serviceController.updateService); // Update an existing service

router.delete("/:id", serviceController.deleteService); // Delete a service

export default router;
