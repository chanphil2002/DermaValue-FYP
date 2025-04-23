import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { title } from "process";
import { assert } from "console";
import { assertHasUser } from "../util/assertHasUser";

export const getClinicians: RequestHandler = async (req, res, next) => {
    try {
        assertHasUser(req);
        const user = req.user; // Assuming you have a middleware that sets req.user
        const clinicians = await prisma.clinician.findMany({
            include: {
              user: true, // Include associated user details if needed
              clinic: true
            },
          });

        res.locals.isIndexPage = true;
        res.render('clinicians/index', { clinicians, title: "Clinicians", user, messages: res.locals.messages });

    } catch (error) {
        next(error);
    }
};

export const getClinician: RequestHandler = async (req, res, next) => {
    const clinicianId = req.params.id;

    try {
        const clinician = await prisma.clinician.findUnique({
            where: { id: clinicianId },
            include: {
                user: true, // Include associated user details if needed
            },
        });

        if (!clinician) {
            res.status(404).json({ error: "Clinician not found" });
            return;
        }

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
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
          }

        const newClinician = await prisma.clinician.create({
            data: {
                user: {
                create: {
                    email,
                    username: name || email.split("@")[0], // Default username if name is not provided
                    password: "defaultpassword", // Replace with hashed password if needed
                    role: "CLINICIAN",
                },
                },
            },
            include: {
                user: true, // Include associated user details
            },
        });
        
        res.status(201).json({ message: "Clinician created successfully", newClinician });
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
    console.log("hello, im here updating someone");

    try {
        const updatedClinician = await prisma.clinician.update({
            where: { id: clinicianId },
            data: {
                approved: true, // Set approved to true
              },
          });

        req.flash('success', 'Clinician updated successfully!');
        res.status(200).redirect('/clinicians'); // Redirect to the index page after updating

    } catch (error) { next(error);}
};

export const deleteClinician: RequestHandler = async (req, res, next) => {
    const clinicianId = req.params.id;

    try {
        await prisma.clinician.delete({
            where: { id: clinicianId },
          });

        res.sendStatus(204);

    } catch (error) { next(error); }
}