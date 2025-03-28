import { RequestHandler } from "express";
import Clinician from "../models/clinician";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export const registerClinician: RequestHandler = async (req, res) => {
    try {
      const { username, password, email, clinic, services } = req.body;
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create clinician with pending approval
      const clinician = new Clinician({
        username,
        password: hashedPassword,
        email,
        clinic,
        services,
        approved: false, // Default to false
      });
  
      await clinician.save();
      res.status(201).json({ message: "Clinician registered, waiting for admin approval." });
    } catch (error) {
      res.status(500).json({ message: "Error registering clinician", error });
    }
  };

export const getClinicians: RequestHandler = async (req, res, next) => {
    try {
        const clinicians = await Clinician.find().exec();
        // res.status(200).json(clinicians);
        res.locals.isIndexPage = true;
        res.render('home', { clinicians });
    } catch (error) {
        next(error);
    }
};

export const getClinician: RequestHandler = async (req, res, next) => {
    const clinicianId = req.params.id;

    try {
        if(!mongoose.isValidObjectId(clinicianId)){ throw createHttpError(400, "Invalid clinician ID"); }
        const clinician = await Clinician.findById(clinicianId).exec();

        if(!clinician){ throw createHttpError(404, "Clinician not found"); }

        res.status(200).json(clinician);
    } catch (error) {
        next(error);
    }
};

interface CreateClinicianBody {
    email?: string;
    name?: string;
}

export const createClinician: RequestHandler<unknown, unknown, CreateClinicianBody, unknown> = async (req, res, next) => {
    const email = req.body.email;
    console.log(email);
    const name = req.body.name;
    console.log(name);

    try {
        if (!email) { throw createHttpError(400, "Email is required"); }

        const newClinician = await Clinician.create({ 
            email: email, 
            name: name  
        });
        // res.status(201).json(newClinician);
        res.redirect("/clinicians");
    } catch (error) { next(error); }
};

interface UpdateClinicianParams {
    id: string;
}

interface UpdateClinicianBody {
    email?: string;
    name?: string;
}

export const updateClinician: RequestHandler<UpdateClinicianParams, unknown, UpdateClinicianBody, unknown> = async (req, res, next) => {
    const clinicianId = req.params.id;
    console.log("clinicianID" + clinicianId);
    const newEmail = req.body.email;
    const newName = req.body.name;

    try {
        if(!mongoose.isValidObjectId(clinicianId)){ throw createHttpError(400, "Invalid clinician ID"); }

        if(!newEmail){ throw createHttpError(400, "Email is required"); }

        const clinician = await Clinician.findById(clinicianId).exec();

        if(!clinician){ throw createHttpError(404, "Clinician not found"); }

        clinician.email = newEmail;

        const updatedClinician = await clinician.save();

        res.status(200).json(updatedClinician);

    } catch (error) { next(error);}
};

export const deleteClinician: RequestHandler = async (req, res, next) => {
    const clinicianId = req.params.id;

    try {
        if(!mongoose.isValidObjectId(clinicianId)){ throw createHttpError(400, "Invalid clinician ID"); }

        const clinician = await Clinician.findByIdAndDelete(clinicianId).exec();

        if(!clinician){ throw createHttpError(404, "Clinician not found"); }

        res.sendStatus(204);

    } catch (error) { next(error); }
}