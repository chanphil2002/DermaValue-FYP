import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";

export const showIndexPage: RequestHandler = (req, res) => {
  res.render("index");
}

// **Create a new clinic**
export const createClinic: RequestHandler = async (req, res, next) => {
  try {
    console.log(req.user);
    const { name, location } = req.body;
    if (!name || !location) {
      throw createHttpError(400, "Name and location are required");
    }

    const clinic = await prisma.clinic.create({
      data: { name, location },
    });

    res.status(201).json({ message: "Clinic created successfully", clinic });
  } catch (error) {
    next(error);
  }
};

// **Get all clinics**
export const getClinics: RequestHandler = async (req, res, next) => {
  try {
    console.log(req.user);
    const clinics = await prisma.clinic.findMany();
    res.status(200).json(clinics);
  } catch (error) {
    next(error);
  }
};

// **Get a single clinic by ID**
export const getClinicById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
    });

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

    const updatedClinic = await prisma.clinic.update({
      where: { id },
      data: updateData,
    });

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

    await prisma.clinic.delete({
      where: { id },
    });

    res.status(200).json({ message: "Clinic deleted successfully" });
    
  } catch (error) {
    next(error);
  }
};
