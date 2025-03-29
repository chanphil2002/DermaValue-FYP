import { Schema, model, InferSchemaType } from "mongoose";

const ClinicSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
});

type Clinic = InferSchemaType<typeof ClinicSchema>;

export default model<Clinic>("Clinic", ClinicSchema);