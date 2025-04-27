import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assert } from "console";
import { assertHasUser } from "../util/assertHasUser";
import { uploadClinicImage, uploadImage } from '../services/cloudinaryService';
import { title } from "process";


export const showNewClinicPage: RequestHandler = (req, res) => {
  assertHasUser(req);
  const user = req.user;

  res.render("clinics/new", { user });
}

// **Create a new clinic**
export const createClinic: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const { name, location } = req.body;
    const clinicImageFile = req.file;

    if (!name || !location) {
      req.flash("error", "Name and location are required.");
      return res.status(400).redirect("/clinics/new");
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
        req.flash("error", "Failed to upload clinic image.");
        return res.status(500).redirect("/clinics/new");
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

    req.flash("success", "Clinic created successfully!");
    res.status(201).redirect("/clinics/all");
  } catch (error) {
    next(error);
  }
};

// **Get all clinics**
export const getClinics: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req, true);
    const user = req.user || null;

    const clinics = await prisma.clinic.findMany({
      include: {
        Case: true,
      }
    });

    // Map clinics to also have a 'totalCases' field
    const clinicsWithCaseCounts = clinics.map((clinic) => ({
      ...clinic,
      totalCases: clinic.Case.filter(c => c.isRecovered).length,
    }));

    res.render('clinics/index', { clinics: clinicsWithCaseCounts, user, title: "Clinics" });
  } catch (error) {
    next(error);
  }
};

// **Get a single clinic by ID**
export const getClinicById: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req, true);
    const user = req.user || null;
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        clinicians: {
          include: { user: true },
        },
        Case: true,
      }
    });

    const clinicScores = await prisma.clinicScore.findMany({
      where: {
        clinicId: id, // or any other criteria
      },
      include: {
        disease: true,
        clinic: true,
      },
    });

    clinicScores.sort((a, b) => (b.avgPromScore || 0) - (a.avgPromScore || 0));

    if (!clinic) {
      req.flash("error", "Clinic not found.");
      return res.status(404).redirect("/clinics");
    }

    const totalCases = clinic.Case.filter(c => c.isRecovered).length;

    res.status(200).render("clinics/show", { clinic, totalCases, title: "Clinic Details", user, clinicScores, messages: res.locals.messages });
  } catch (error) {
    next(error);
  }
};

// Get Clinic by ID (to display the edit form with pre-filled data)
export const getEditClinicByIdForm: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req, true);
    const user = req.user || null;
    const { id } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        clinicians: {
          include: { user: true },
        },
        Case: true,
      },
    });

    if (!clinic) {
      req.flash("error", "Clinic not found.");
      return res.status(404).redirect("/clinics");
    }

    res.status(200).render("clinics/edit", { clinic, title: "Edit Clinic", user });
  } catch (error) {
    next(error);
  }
};


// **Update a clinic by ID**
export const updateClinic: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const clinicImageFile = req.file;

    const updatedClinicData: { name: any; location: any; profileImageUrl?: string; profileImageId?: string } = {
      name,
      location,
    };

    if (clinicImageFile) {
      try {
        const filePath = clinicImageFile.path;
        // Upload the image to Cloudinary and get the result
        const result = await uploadClinicImage(filePath, id);  // Use clinic ID as public_id

        // Update the clinic with the new image URL and public_id
        updatedClinicData.profileImageUrl = result.uploadResult.secure_url;
        updatedClinicData.profileImageId = result.uploadResult.public_id;

        console.log("Image uploaded successfully:", result.uploadResult.secure_url);
      } catch (error) {
        req.flash("error", "Failed to upload clinic image.");
        return res.status(500).redirect(`/clinics/${id}/edit`);
      }
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id },
      data: updatedClinicData
    });

    if (!updatedClinic) {
      req.flash("error", "Clinic not found.");
      return res.status(404).redirect("/clinics");
    }

    req.flash("success", "Clinic updated successfully!");
    res.status(200).redirect(`/clinics/${id}`); // Redirect to the updated clinic's page

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
