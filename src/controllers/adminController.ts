import { RequestHandler } from "express";
import prisma from "../util/prisma";

export const approveClinician: RequestHandler = async (req, res) => {
  try {
    const { clinicianId } = req.params;

    // Update the clinician's approval status
    const updatedClinician = await prisma.clinician.update({
      where: { id: clinicianId },
      data: { approved: true }, // Assuming `approved` is a boolean field in your schema
    });

    res.status(200).json({ message: "Clinician approved successfully", clinician: updatedClinician });

  } catch (error) {

    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    
  }
};

export const rejectClinician: RequestHandler = async (req, res) => {
    try {
      const { clinicianId } = req.params;
  
      // Delete the clinician record
      const deletedClinician = await prisma.clinician.delete({
        where: { id: clinicianId },
      });
  
      res.status(200).json({ message: "Clinician rejected successfully", clinician: deletedClinician });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    }
  };
