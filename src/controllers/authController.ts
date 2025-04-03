import { RequestHandler } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import bcrypt from "bcrypt";
import { assertHasUser } from "../util/assertHasUser";

// type UserRole = (typeof $Enums.UserRole)[keyof typeof $Enums.UserRole];

export const getLoginPage: RequestHandler = (req, res) => {
  const { role } = req.params; // Get the role from the URL parameter

  const loginPath = `/login/${role}`;

  res.render("auth/login", { title: role.charAt(0).toUpperCase() + role.slice(1), loginPath } ); // Render the login page
}

export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    const { role } = req.params; // Get the role from the URL parameter
    const roleTitle = role.toUpperCase(); // Convert role to uppercase for comparison
    console.log(roleTitle); // Log the role for debugging
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

    if (!user || user.role !== roleTitle) throw createHttpError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw createHttpError(401, "Invalid credentials");

    // **Clinician Login Requires Approval**
    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId: user.id },
      });

      if (!clinician) throw createHttpError(404, "Clinician profile not found");
      if (!clinician.approved) throw createHttpError(403, "Clinician not approved by admin");
    }

    // Construct the JWT payload dynamically based on the role
    const payload: Record<string, any> = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      payload.clinicianId = user.clinicianId; // Add clinician-specific data
    } else if (roleTitle === $Enums.UserRole.PATIENT) {
      payload.patientId = user.patientId; // Add patient-specific data
    }

    console.log(payload); // Log the payload for debugging

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    // Set HTTP-only Secure Cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 60 * 60 * 1000, // Cookie expires in 1 hour
    });

    res.redirect('/'); // Redirect to the patient's dashboard after successful login

  } catch (error) {
    next(error);
  }
};

export const getDashboard: RequestHandler = (req, res, next) => {
  assertHasUser(req); // Ensure req.user is defined
  const user = req.user;

  console.log(user.patientId); // Log the user object for debugging

  if (user.role === $Enums.UserRole.PATIENT) {
    return res.render("index", { title: "Patient Dashboard", user });
  } else if (req.user.role === $Enums.UserRole.CLINICIAN) {
    return res.render("index", { title: "Clinician Dashboard", user });
  } else if (req.user.role === $Enums.UserRole.ADMIN) {
    return res.render("index", { title: "Admin Dashboard", user });
  } else { return res.render("index", { title: "DASHBOARD", user }); }
}

export const getRegisterPage: RequestHandler = (req, res) => {
  const { role } = req.params; // Get the role from the URL parameter

  const registerPath = `/register/${role}`;

  res.render("auth/register", { title: role.charAt(0).toUpperCase() + role.slice(1), registerPath } ); // Render the login page
}

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { role } = req.params; // Get the role from the URL parameter
    const roleTitle = role.toUpperCase(); // Convert role to uppercase for comparison

    const { username, email, password, clinic, medicalHistory } = req.body;

    if (!username || !email || !password || !roleTitle) {
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
    const user = await prisma.$transaction(async (tx) => {
      // **Create User**
      const newUser = await tx.user.create({
        data: { username, email, password: hashedPassword, role: roleTitle as $Enums.UserRole },
      });
      
      let clinicianId = null;
      let patientId = null;

      // **Create Profile Based on Role**
      if (roleTitle === $Enums.UserRole.CLINICIAN) {
        const clinician = await tx.clinician.create({
          data: {
            userId: newUser.id,
            clinicId: clinic || null, // Allow null clinic
            approved: false,
          },
        });
        clinicianId = clinician.id;

      } else if (roleTitle === $Enums.UserRole.PATIENT) {
        const patient = await tx.patient.create({
          data: {
            userId: newUser.id,
            medicalHistory: medicalHistory || "",
          },
        });
        patientId = patient.id;
      }

      console.log(newUser.id);
      console.log(patientId);
      console.log(clinicianId);

      await tx.user.update({
        where: { id: newUser.id },
        data: roleTitle === $Enums.UserRole.CLINICIAN
        ? { clinicianId } // Update only clinicianId if the role is CLINICIAN
        : { patientId },   // Update only patientId if the role is PATIENT
      });
      return { ...newUser, clinicianId, patientId };
    });

    // Construct the JWT payload dynamically based on the role
    const payload: Record<string, any> = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      payload.clinicianId = user.clinicianId; // Add clinician-specific data
    } else if (roleTitle === $Enums.UserRole.PATIENT) {
      payload.patientId = user.patientId; // Add patient-specific data
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    // Set HTTP-only Secure Cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 60 * 60 * 1000, // Cookie expires in 1 hour
    });

    res.redirect("/");

  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (req, res, next) => {
  try {
    res.redirect("/");  // Redirect to the login page

  } catch (error) {
    next(error);  // Pass any errors to the error handler
  }
};
