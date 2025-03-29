import { RequestHandler } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import User from "../models/user";
import Clinician from "../models/clinician";
import Patient from "../models/patient";
import { UserRole } from "../enums/userRole";

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { username, email, password, role, clinic, services, medicalHistory } = req.body;

    if (!username || !email || !password || !role) {
      throw createHttpError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(409, "User already exists");
    }

    // **Create User**
    const user = new User({ username, email, password, role });
    await user.save();

    // **Create Profile Based on Role**
    if (role === UserRole.CLINICIAN) {
      const clinician = new Clinician({ user: user._id, clinic, services, approved: false });
      await clinician.save();
    } else if (role === UserRole.PATIENT) {
      const patient = new Patient({ user: user._id, medicalHistory });
      await patient.save();
    }

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (error) {
    next(error);
  }
};

export const loginUser = (role: UserRole.CLINICIAN | UserRole.PATIENT ): RequestHandler => async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || !role) {
      throw createHttpError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== role) throw createHttpError(401, "Invalid credentials");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw createHttpError(401, "Invalid credentials");

    // **Clinician Login Requires Approval**
    if (role === UserRole.CLINICIAN) {
      const clinician = await Clinician.findOne({ user: user._id });
      if (!clinician) throw createHttpError(404, "Clinician profile not found");
      if (!clinician.approved) throw createHttpError(403, "Clinician not approved by admin");
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};
