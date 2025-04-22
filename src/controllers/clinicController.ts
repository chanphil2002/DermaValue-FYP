import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assert } from "console";
import { assertHasUser } from "../util/assertHasUser";
import { uploadClinicImage, uploadImage } from '../util/cloudinary/index';


export const showNewClinicPage: RequestHandler = (req, res) => {
  assertHasUser(req);
  const user = req.user;

  res.render("clinics/new", { user });
}

export const showIndexPage: RequestHandler = async (req, res) => {
  assertHasUser(req);
  const user = req.user;

  const clinics = await prisma.clinic.findMany();

  res.render("clinics/index", { clinics, user });
}

// **Create a new clinic**
export const createClinic: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const { name, location } = req.body;
    const clinicImageFile = req.file;
    console.log(name, location);

    if (!name || !location ) {
      throw createHttpError(400, "name and location are required");
    }

    const clinic = await prisma.clinic.create({
      data: { name, location },
    });

    // Check if a clinic image was uploaded
    if (clinicImageFile) {
      try {
        const filePath = clinicImageFile.path;
        // Upload the image to Cloudinary
        const result = await uploadClinicImage(filePath, clinic.id);

        // Update the clinic with the image URL
        await prisma.clinic.update({
          where: { id: clinic.id },
          data: {
            profileImageUrl: result.uploadResult.secure_url,
            profileImageId: result.uploadResult.public_id,
          },
        });

        console.log("Image uploaded successfully:", result.uploadResult.secure_url);

      } catch (error) {
        // In case of an error while uploading, handle it properly
        await prisma.clinic.delete({ where: { id: clinic.id } }); // Rollback clinic creation if upload fails
        throw createHttpError(500, "Error uploading clinic image");
      }
    } else {
      // No image uploaded, set a default image URL
      const defaultImageUrl = "https://res.cloudinary.com/ddohywyci/image/upload/v1745087160/DermaValue/clinics/lzuhdbuwg7xtwqurusfy.jpg"; // Replace with your actual default image URL
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          profileImageUrl: defaultImageUrl,
        },
      });

      console.log("No image uploaded. Default image URL set:", defaultImageUrl);
    }

    res.status(201).redirect("/clinics/all");
  } catch (error) {
    next(error);
  }
};

// **Get all clinics**
export const getClinics: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;

    const clinics = await prisma.clinic.findMany();
    res.render('clinics/index', { clinics, user });
  } catch (error) {
    next(error);
  }
};

// **Get a single clinic by ID**
export const getClinicById: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        clinicians: {
          include: { user: true },
        }
      }
    });

    console.log(clinic)

    if (!clinic) {
      throw createHttpError(404, "Clinic not found");
    }

    res.status(200).render("clinics/show", { clinic, title: "Clinic Details", user });
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
