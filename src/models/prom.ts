import { InferSchemaType, Schema, model } from 'mongoose';

const promSchema = new Schema({
    // email: { type: String, required: true },
    // name: { type: String },
}, { timestamps: true });

type Prom = InferSchemaType<typeof promSchema>;

export default model<Prom>('Prom', promSchema);

