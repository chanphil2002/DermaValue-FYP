import { RequestHandler } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import bcrypt from "bcrypt";

type UserRole = (typeof $Enums.UserRole)[keyof typeof $Enums.UserRole];

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { username, email, password, role, clinic, services, medicalHistory } = req.body;

    if (!username || !email || !password || !role) {
      throw createHttpError(400, "All fields are required");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // **Create User and Profile in a Transaction**
    const result = await prisma.$transaction(async (tx) => {
      // **Create User**
      const user = await tx.user.create({
        data: { username, email, password: hashedPassword, role },
      });

      // **Create Profile Based on Role**
      if (role === $Enums.UserRole.CLINICIAN) {
        await tx.clinician.create({
          data: {
            userId: user.id,
            clinicId: clinic || null, // Allow null clinic
            services: {
              connect: services?.map((id: string) => ({ id })) || [],
            },
            approved: false,
          },
        });
      } else if (role === $Enums.UserRole.PATIENT) {
        await tx.patient.create({
          data: {
            userId: user.id,
            medicalHistory: medicalHistory || "",
          },
        });
      }

      return user;
    });

    res.status(201).json({ message: "User registered successfully", userId: result.id });
  } catch (error) {
    next(error);
  }
};

export const loginUser = (role: UserRole): RequestHandler => async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || !role) {
      throw createHttpError(400, "Email and password are required");
    }

    // Fetch the user and include role-specific data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clinician: role === $Enums.UserRole.CLINICIAN, // Include clinician data if role is CLINICIAN
        patient: role === $Enums.UserRole.PATIENT,    // Include patient data if role is PATIENT
      },
    });

    if (!user || user.role !== role) throw createHttpError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw createHttpError(401, "Invalid credentials");

    // **Clinician Login Requires Approval**
    if (role === $Enums.UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId: user.id },
      });

      console.log(clinician);
      if (!clinician) throw createHttpError(404, "Clinician profile not found");
      if (!clinician.approved) throw createHttpError(403, "Clinician not approved by admin");
    }

    // Construct the JWT payload dynamically based on the role
    const payload: Record<string, any> = {
      userId: user.id,
      role: user.role,
    };

    if (role === $Enums.UserRole.CLINICIAN) {
      payload.clinicianId = user.clinician?.id; // Add clinician-specific data
    } else if (role === $Enums.UserRole.PATIENT) {
      payload.patientId = user.patient?.id; // Add patient-specific data
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};
