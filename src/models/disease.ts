import { InferSchemaType, Schema, model } from 'mongoose';

const diseaseSchema = new Schema({
    // email: { type: String, required: true },
    // name: { type: String },
}, { timestamps: true });

type Disease = InferSchemaType<typeof diseaseSchema>;

export default model<Disease>('Disease', diseaseSchema);

