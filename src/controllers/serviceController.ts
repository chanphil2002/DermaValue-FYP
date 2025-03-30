import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";

// Get all services
export const getServices: RequestHandler = async (req, res, next) => {
    try {
        const services = await prisma.service.findMany({
            include: {
              clinicians: true, // Include associated clinicians
            },
          });

        res.locals.isIndexPage = true;
        res.render("home", { services });

    } catch (error) {
        next(error);
    }
};

// Get a single service by ID
export const getService: RequestHandler = async (req, res, next) => {
    const serviceId = req.params.id;

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
              clinicians: true, // Include associated clinicians
            },
          });

        if (!service) {
            throw createHttpError(404, "Service not found");
        }

        res.status(200).json(service);
        
    } catch (error) {
        next(error);
    }
};

// Interface for request body when creating a new service
interface CreateServiceBody {
    name?: string;
}

// Create a new service
export const createService: RequestHandler<unknown, unknown, CreateServiceBody, unknown> = async (req, res, next) => {
    const { name } = req.body;

    try {
        if (!name) {
            throw createHttpError(400, "All fields are required (name, description, price, clinic)");
        }

        const newService = await prisma.service.create({
            data: {
              name
            },
          });

        res.status(201).json({ message: "Clinic created successfully", newService });

    } catch (error) {
        next(error);
    }
};

// Interface for updating a service
interface UpdateServiceParams {
    id: string;
}

interface UpdateServiceBody {
    name?: string;
}

// Update a service by ID
export const updateService: RequestHandler<UpdateServiceParams, unknown, UpdateServiceBody, unknown> = async (req, res, next) => {
    const serviceId = req.params.id;
    const { name } = req.body;

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
          });

        if (!service) {
            throw createHttpError(404, "Service not found");
        }

        if (name) service.name = name;

        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
              name: name || service.name,
            },
          });

        res.status(200).json(updatedService);

    } catch (error) {
        next(error);
    }
};

// Delete a service by ID
export const deleteService: RequestHandler = async (req, res, next) => {
    const serviceId = req.params.id;

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });

        if (!service) {
            throw createHttpError(404, "Service not found");
        }

        await prisma.service.delete({
            where: { id: serviceId },
        });

        res.sendStatus(204); // No content

    } catch (error) {
        next(error);
    }
};
