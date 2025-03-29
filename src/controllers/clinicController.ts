import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Clinic from "../models/clinic";

// **Create a new clinic**
export const createClinic: RequestHandler = async (req, res, next) => {
  try {
    console.log(req.user);
    const { name, location } = req.body;
    if (!name || !location) {
      throw createHttpError(400, "Name and location are required");
    }

    const clinic = new Clinic({ name, location });
    await clinic.save();

    res.status(201).json({ message: "Clinic created successfully", clinic });
  } catch (error) {
    next(error);
  }
};

// **Get all clinics**
export const getClinics: RequestHandler = async (req, res, next) => {
  try {
    console.log(req.user);
    const clinics = await Clinic.find();
    res.status(200).json(clinics);
  } catch (error) {
    next(error);
  }
};

// **Get a single clinic by ID**
export const getClinicById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw createHttpError(400, "Invalid clinic ID");
    }

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      throw createHttpError(404, "Clinic not found");
    }

    res.status(200).json(clinic);
  } catch (error) {
    next(error);
  }
};

// **Update a clinic by ID**
export const updateClinic: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.isValidObjectId(id)) {
      throw createHttpError(400, "Invalid clinic ID");
    }

    const updatedClinic = await Clinic.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedClinic) {
      throw createHttpError(404, "Clinic not found");
    }

    res.status(200).json(updatedClinic);
  } catch (error) {
    next(error);
  }
};

// **Delete a clinic by ID**
export const deleteClinic: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw createHttpError(400, "Invalid clinic ID");
    }

    const deletedClinic = await Clinic.findByIdAndDelete(id);
    if (!deletedClinic) {
      throw createHttpError(404, "Clinic not found");
    }

    res.status(200).json({ message: "Clinic deleted successfully" });
  } catch (error) {
    next(error);
  }
};
