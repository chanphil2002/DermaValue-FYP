import { Schema, model, InferSchemaType } from 'mongoose';

const patientSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    medicalHistory: { type: String },
}, { timestamps: true });

type Patient = InferSchemaType<typeof patientSchema>;

export default model<Patient>('Patient', patientSchema);

