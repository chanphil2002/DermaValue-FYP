import express from "express";
import * as NotesController from "../controllers/notes";

const router = express.Router();

router.get("/", NotesController.getNotes);

router.get("/:id", NotesController.getNote);

router.post("/", NotesController.createNote);

router.patch("/:id", NotesController.updateNote);

router.delete("/:id", NotesController.deleteNote);

export default router;