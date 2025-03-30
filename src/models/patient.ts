import { Schema, model, InferSchemaType } from 'mongoose';

const PatientSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    medicalHistory: { type: String },
}, { timestamps: true });

type Patient = InferSchemaType<typeof PatientSchema>;

export default model<Patient>('Patient', PatientSchema);

