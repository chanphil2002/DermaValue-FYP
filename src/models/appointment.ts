import { Schema, model, InferSchemaType } from "mongoose";
import { AppointmentStatus } from "../enums/appointmentStatus";

const AppointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    clinician: { type: Schema.Types.ObjectId, ref: "Clinician", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic", default: null }, // Can be assigned later
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(AppointmentStatus), default: "pending" },
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt`
);

type Appointment = InferSchemaType<typeof AppointmentSchema>;

export default model<Appointment>("Appointment", AppointmentSchema);