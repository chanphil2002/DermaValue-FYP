import { Schema, model, InferSchemaType } from "mongoose";

const DiseaseSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
    },
    { timestamps: true }
  );

type Disease = InferSchemaType<typeof DiseaseSchema>;

export default model<Disease>('Disease', DiseaseSchema);

