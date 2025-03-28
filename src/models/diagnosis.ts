import { InferSchemaType, Schema, model } from 'mongoose';

const diagnosisSchema = new Schema({
    // email: { type: String, required: true },
    // name: { type: String },
}, { timestamps: true });

type Diagnosis = InferSchemaType<typeof diagnosisSchema>;

export default model<Diagnosis>('Diagnosis', diagnosisSchema);

