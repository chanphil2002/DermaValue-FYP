import { Schema, model, InferSchemaType } from "mongoose";

const PromResponseSchema = new Schema({
  appointment: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  clinician: { type: Schema.Types.ObjectId, ref: "Clinician", required: true },
  prom: { type: Schema.Types.ObjectId, ref: "Prom", required: true }, // Links to the PROM template
  responses: [
    {
      question: { type: String, required: true },
      score: { type: Number, required: true, min: 0 },
    },
  ],
  submittedAt: { type: Date, default: Date.now },
  totalScore: { type: Number, default: 0 },
});

type PromResponse = InferSchemaType<typeof PromResponseSchema>;

export default model("PromResponse", PromResponseSchema);
