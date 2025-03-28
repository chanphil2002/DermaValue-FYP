import mongoose, { Schema, Document } from "mongoose";

export interface IClinic extends Document {
  name: string;
  location: string;
}

const ClinicSchema = new Schema<IClinic>({
  name: { type: String, required: true },
  location: { type: String, required: true },
});

export default mongoose.model<IClinic>("Clinic", ClinicSchema);