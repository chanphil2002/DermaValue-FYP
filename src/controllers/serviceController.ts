import { RequestHandler } from "express";
import Service from "../models/service";
import createHttpError from "http-errors";
import mongoose from "mongoose";

// Get all services
export const getServices: RequestHandler = async (req, res, next) => {
    try {
        const services = await Service.find().populate("clinic clinicians").exec();
        res.locals.isIndexPage = true;
        res.render("home", { services }); // Render with template engine
    } catch (error) {
        next(error);
    }
};

// Get a single service by ID
export const getService: RequestHandler = async (req, res, next) => {
    const serviceId = req.params.id;

    try {
        if (!mongoose.isValidObjectId(serviceId)) {
            throw createHttpError(400, "Invalid service ID");
        }

        const service = await Service.findById(serviceId).populate("clinic clinicians").exec();
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

        const newService = new Service({
            name
        });

        await newService.save();
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
        if (!mongoose.isValidObjectId(serviceId)) {
            throw createHttpError(400, "Invalid service ID");
        }

        const service = await Service.findById(serviceId).exec();
        if (!service) {
            throw createHttpError(404, "Service not found");
        }

        if (name) service.name = name;

        const updatedService = await service.save();
        res.status(200).json(updatedService);
    } catch (error) {
        next(error);
    }
};

// Delete a service by ID
export const deleteService: RequestHandler = async (req, res, next) => {
    const serviceId = req.params.id;

    try {
        if (!mongoose.isValidObjectId(serviceId)) {
            throw createHttpError(400, "Invalid service ID");
        }

        const service = await Service.findByIdAndDelete(serviceId).exec();
        if (!service) {
            throw createHttpError(404, "Service not found");
        }

        res.sendStatus(204); // No content
    } catch (error) {
        next(error);
    }
};
