import { Schema, model, InferSchemaType } from "mongoose";

const ClinicianSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clinic: { type: Schema.Types.ObjectId, ref: "Clinic", default: null },
  services: { type: [{ type: Schema.Types.ObjectId, ref: "Service" }], default: [] },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

type Clinician = InferSchemaType<typeof ClinicianSchema>;

export default model<Clinician>("Clinician", ClinicianSchema); 