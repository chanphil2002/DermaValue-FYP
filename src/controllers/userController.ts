import { RequestHandler } from "express";
import createHttpError from "http-errors";
import prisma from "../util/prisma";
import { $Enums } from "@prisma/client";
import { assertHasUser } from "../util/assertHasUser";
import { uploadImage } from '../services/cloudinaryService';

export const uploadHandler: RequestHandler = async (req, res, next) => {
    try {
      assertHasUser(req);
      const user = req.user;
      const { imageUrl } = req.body;// or req.body.image
      const result = await uploadImage(imageUrl, 'users', user.id); // Pass the user ID to the upload function

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          profileImageUrl: result.uploadResult.secure_url,
          profileImageId: result.uploadResult.public_id,
        }, // Save the optimized URL to the user record
      })

      res.json({
          message: 'Image uploaded successfully!',
          result
      });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error });
    }
};