import { Request, Response } from "express";
import Clinician from "../models/clinician";

export const approveClinician = async (req: Request, res: Response) => {
  try {
    const { clinicianId } = req.params;

    await Clinician.findByIdAndUpdate(clinicianId, { status: "approved" });

    res.status(200).json({ message: "Clinician approved successfully" });

  } catch (error) {

    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    
  }
};

export const rejectClinician = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clinicianId } = req.params;
  
      await Clinician.findByIdAndDelete(clinicianId);
  
      res.status(200).json({ message: "Clinician rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    }
  };
