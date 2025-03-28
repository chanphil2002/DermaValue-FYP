import { InferSchemaType, Schema, model } from 'mongoose';

const patientSchema = new Schema({
    email: { type: String, required: true },
    name: { type: String },
    age: { type: Number },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["patient", "clinician"] },
}, { timestamps: true });

type Patient = InferSchemaType<typeof patientSchema>;

export default model<Patient>('Patient', patientSchema);

