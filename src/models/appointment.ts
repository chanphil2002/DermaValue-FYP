import { Schema, model, InferSchemaType, Document, Types } from "mongoose";
import { AppointmentStatus } from "../enums/appointmentStatus";

// Define the ClinicianDocument type to be used in populating clinician
interface ClinicianDocument extends Document {
  user: { _id: string, username: string, email: string }; // Assuming the user field inside Clinician
  clinic: string | null;
  services: string[];
  approved: boolean;
}

const AppointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    clinician: { type: Schema.Types.ObjectId, ref: "Clinician", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", default: null }, // Can be assigned later
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(AppointmentStatus), default: "pending" },
    diagnosis: { type: Schema.Types.ObjectId, ref: "Diagnosis", default: null },
    prom: [{ type: Schema.Types.ObjectId, ref: "PromResponse", default: [] }]
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt`
);

type Appointment = InferSchemaType<typeof AppointmentSchema> & {
  clinician: ClinicianDocument;  // Clinician should be a populated document
  prom: Types.ObjectId[]; // Array of PromResponse ObjectIds
};

export default model<Appointment>("Appointment", AppointmentSchema); 