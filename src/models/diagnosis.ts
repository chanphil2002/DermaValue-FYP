import { Schema, model, InferSchemaType } from "mongoose";

const DiagnosisSchema = new Schema(
    {
      appointment: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
      clinician: { type: Schema.Types.ObjectId, ref: "Clinician", required: true },
      disease: { type: Schema.Types.ObjectId, ref: "Disease", required: true },
      description: { type: String, required: true },
      treatmentPlan: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

type Diagnosis = InferSchemaType<typeof DiagnosisSchema>;

export default model<Diagnosis>('Diagnosis', DiagnosisSchema);

