import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { assertHasUser } from "../util/assertHasUser";
import { uploadImageFromBuffer } from '../services/cloudinaryService';
import bcrypt from "bcrypt";

export const uploadHandler: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    
    const fileBuffer = req.file?.buffer;

    if (!fileBuffer) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const result = await uploadImageFromBuffer(fileBuffer, 'users', user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImageUrl: result.secure_url,
        profileImageId: result.public_id,
      },
    })

    res.json({
      message: 'Image uploaded successfully!',
      profileImageUrl: result.secure_url, // <-- only useful info
      user: { profileImageUrl: result.secure_url }, // <-- only useful info}
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error });
  }
};

export const getUserProfile: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { clinician: true },
    });

    if (!userProfile) {
      return next(createHttpError(404, "User not found"));
    }

    res.render("profile/edit", { user: userProfile, messages: res.locals.messages, title: "Edit Profile" });
  } catch (error) {
    next(error);
  }
}

export const updateUserProfile: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    const user = req.user;
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: name,
        email,
        password: hashedPassword,
      },
    });

    req.flash("success", "Profile updated successfully!");
    res.status(200).redirect("/users/profile/edit");
  } catch (error) {
    next(error);
  }
};