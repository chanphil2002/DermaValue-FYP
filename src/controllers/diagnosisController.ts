import { RequestHandler } from "express";
import createHttpError from "http-errors";
import Diagnosis from "../models/diagnosis";
import Disease from "../models/disease";
import Appointment from "../models/appointment";
import { assertHasUser } from "../util/assertHasUser";

// Add Diagnosis to Appointment
export const addDiagnosis: RequestHandler = async (req, res, next) => {
  try {
    assertHasUser(req);
    
    const { id } = req.params; // Appointment ID from URL params
    const loggedInUserId = req.user.userId;
    const { disease, description, treatmentPlan } = req.body; // Diagnosis and treatment plan from request body

    // Validate input
    if (!disease || !description || !treatmentPlan) {
      throw createHttpError(400, "Diagnosis and treatment plan are required");
    }

    // Find the appointment
    const appointment = await Appointment.findById(id)
      .populate("clinician")
      .exec();

    if (!appointment) {
      throw createHttpError(404, "Appointment not found");
    }

    // Check if the clinician is authorized to add the diagnosis
    if (appointment.clinician.user._id.toString() !== loggedInUserId.toString()) {
      throw createHttpError(403, "You are not authorized to add diagnosis for this appointment");
    }

    // Check if a diagnosis already exists for this appointment
    const existingDiagnosis = await Diagnosis.findOne({ appointment: id });
    if (existingDiagnosis) {
      throw createHttpError(409, "Diagnosis already exists for this appointment");
    }

    // Validate if disease exists in the database
    const diseaseExists = await Disease.findById(disease);
    if (!diseaseExists) {
      throw createHttpError(404, "Specified disease not found");
    }

    // Create the diagnosis record
    const diagnosisRecord = new Diagnosis({
      appointment: appointment._id,
      clinician: appointment.clinician._id,
      disease,
      description,
      treatmentPlan,
    });
    
    await diagnosisRecord.save();

    appointment.diagnosis = diagnosisRecord._id;
    await appointment.save();

    res.status(201).json({ message: "Diagnosis added successfully", diagnosis: diagnosisRecord });
  } catch (error) {
    next(error);
  }
};

export const getDiagnosisByAppointment: RequestHandler = async (req, res, next) => {
    try {
      const { appointmentId } = req.params;
  
      const diagnosis = await Diagnosis.findOne({ appointment: appointmentId }).populate("clinician");
  
      if (!diagnosis) {
        throw createHttpError(404, "No diagnosis found for this appointment");
      }
  
      res.status(200).json(diagnosis);
    } catch (error) {
      next(error);
    }
  };


  export const updateDiagnosis: RequestHandler = async (req, res, next) => {
    try {
    assertHasUser(req);
      const { diagnosisId } = req.params;
      const { diagnosis, treatmentPlan } = req.body;
  
      const existingDiagnosis = await Diagnosis.findById(diagnosisId).populate("disease");
      if (!existingDiagnosis) {
        throw createHttpError(404, "Diagnosis not found");
      }
  
      // Ensure only the assigned clinician can update the diagnosis
      if (existingDiagnosis.clinician.toString() !== req.user?.userId.toString()) {
        throw createHttpError(403, "You are not authorized to update this diagnosis");
      }
  
      existingDiagnosis.disease = diagnosis || existingDiagnosis.disease;
      existingDiagnosis.treatmentPlan = treatmentPlan || existingDiagnosis.treatmentPlan;
  
      await existingDiagnosis.save();
  
      res.status(200).json({ message: "Diagnosis updated successfully", diagnosis: existingDiagnosis });
    } catch (error) {
      next(error);
    }
  };


