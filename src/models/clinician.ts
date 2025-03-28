import mongoose, { Schema, Document } from "mongoose";

export interface IClinician extends Document {
  username: string;
  password: string;
  email: string;
  clinic: mongoose.Schema.Types.ObjectId;
  services: mongoose.Schema.Types.ObjectId[];
  approved: boolean;
}

const ClinicianSchema = new Schema<IClinician>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  clinic: { type: Schema.Types.ObjectId, ref: "Clinic" },
  services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  approved: { type: Boolean, default: false }, // Pending approval
});

export default mongoose.model<IClinician>("Clinician", ClinicianSchema);