import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import bcrypt from "bcrypt";
import { assertHasUser } from "../util/assertHasUser";

// type UserRole = (typeof $Enums.UserRole)[keyof typeof $Enums.UserRole];

export const getLoginPage: RequestHandler = (req, res) => {
  // const { role } = req.params; // Get the role from the URL parameter

  // const loginPath = `/login/${role}`;

  // res.render("auth/login", { title: role.charAt(0).toUpperCase() + role.slice(1), loginPath } ); 

  res.render("auth/login", { title: "Login", messages: res.locals.messages}); // Render the login page
}

export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    // const { role } = req.params; // Get the role from the URL parameter
    const { email, password, role } = req.body;
    const roleTitle = role.toUpperCase(); // Convert role to uppercase for comparison

    if (!email || !password || !role) {
      req.flash('error', 'Email and password are required!');
      res.redirect("/login"); // Redirect to the login page
    }

    // Fetch the user and include role-specific data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clinician: roleTitle === $Enums.UserRole.CLINICIAN, // Include clinician data if role is CLINICIAN
        patient: roleTitle === $Enums.UserRole.PATIENT,    // Include patient data if role is PATIENT
      },
    });

    if (!user || user.role !== roleTitle) {
      req.flash('error', 'Invalid Credentials!');
      return res.status(401).redirect("/login"); // Redirect to the login page
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { 
      req.flash('error', 'Invalid Credentials!');
      return res.status(401).redirect("/login"); // Redirect to the login page
    }

    // **Clinician Login Requires Approval**
    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId: user.id },
      });

      if (!clinician) {
        req.flash('error', 'Clinician Profile not Found!');
        return res.status(404).redirect("/login"); // Redirect to the login page
      }
      if (!clinician.approved) {
        req.flash('error', 'Clinician not Approved by Admin!');
        return res.status(403).redirect("/login"); // Redirect to the login page
      }
    }

    // Construct the JWT payload dynamically based on the role
    const payload: Record<string, any> = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl
    };

    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      payload.clinicianId = user.clinicianId; // Add clinician-specific data
      payload.clinicId = user.clinician?.clinicId; // Add clinic-specific data
    } else if (roleTitle === $Enums.UserRole.PATIENT) {
      payload.patientId = user.patientId; // Add patient-specific data
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

    // Set HTTP-only Secure Cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "lax", // Prevent CSRF attacks
      maxAge: 60 * 60 * 1000, // Cookie expires in 1 hour
    });

    if (roleTitle === $Enums.UserRole.ADMIN) {
      req.flash('success', 'Successfully login!');
      console.log("Session before redirect:", req.session);
      res.redirect('/clinicians');
    } else if (roleTitle === $Enums.UserRole.CLINICIAN) {
      req.flash('success', 'Successfully login!');
      console.log("Session before redirect:", req.session);
      res.redirect('/cases');
    } else if (roleTitle === $Enums.UserRole.PATIENT) {
      req.flash('success', 'Successfully login!');
      console.log("Session before redirect:", req.session);
      res.redirect('/cases');
    } else {
      res.redirect('/'); // fallback
    }

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

export const getPatientRegisterPage: RequestHandler = (req, res) => {
  // const { role } = req.params; // Get the role from the URL parameter

  // const registerPath = `/register/${role}`;

  // res.render("auth/register", { title: role.charAt(0).toUpperCase() + role.slice(1), registerPath } ); // Render the login page
  res.render("auth/register-patient", {title: "Register as Patient"}); // Render the login page
}

export const getClinicianRegisterPage: RequestHandler = async (req, res) => {
  // const { role } = req.params; // Get the role from the URL parameter

  // const registerPath = `/register/${role}`;

  const clinics = await prisma.clinic.findMany(); // Fetch all clinics from the database

  // res.render("auth/register", { title: role.charAt(0).toUpperCase() + role.slice(1), registerPath } ); // Render the login page
  res.render("auth/register-clinician", {title: "Register as Clinician", clinics}); // Render the login page
}

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { role } = req.body;
    const roleTitle = role.toUpperCase(); 

    const { username, email, password, title, clinicId, medicalHistory } = req.body;

    if (!username || !email || !password || !roleTitle) {
      req.flash("error", "All fields are required!");
      return res.redirect("/register/"+ roleTitle); // Redirect to the register page with the role
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      req.flash("error", "User already exists!");
      return res.redirect("/register/"+ roleTitle); // Redirect to the register page with the role
    }

    if (roleTitle === $Enums.UserRole.CLINICIAN && !clinicId) {
      req.flash("error", "You need to attach a Clinic before proceeding.");
      return res.redirect("/register/"+ roleTitle); // Redirect to the register page with the role
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { username, email, password: hashedPassword, role: roleTitle as $Enums.UserRole },
      });
      
      let clinicianId = null;
      let patientId = null;

      if (roleTitle === $Enums.UserRole.CLINICIAN) {
        const clinic = await prisma.clinic.findUnique({
          where: { id: clinicId },
        });

        const clinician = await tx.clinician.create({
          data: {
            userId: newUser.id,
            clinicId: clinic ? clinic.id : null,
            title,
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

      await tx.user.update({
        where: { id: newUser.id },
        data: roleTitle === $Enums.UserRole.CLINICIAN ? { clinicianId } : { patientId },
      });

      return { ...newUser, clinicianId, patientId };
    });

    const payload: Record<string, any> = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      payload.clinicianId = user.clinicianId;
    } else if (roleTitle === $Enums.UserRole.PATIENT) {
      payload.patientId = user.patientId;
    }

    if (roleTitle !== $Enums.UserRole.CLINICIAN) {
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });
    }

    if (roleTitle === $Enums.UserRole.CLINICIAN) {
      req.flash('success', 'Clinician registered successfully! Please wait for admin approval.');
      res.redirect("/login"); // Redirect to the login page
    }
    res.redirect("/");

  } catch (error) {
    next(error);
  }
};


export const logout: RequestHandler = (req, res, next) => {
  try {
    req.flash('success', 'Logout Successfully!');
    res.redirect("/login");  // Redirect to the login page

  } catch (error) {
    next(error);  // Pass any errors to the error handler
  }
};
