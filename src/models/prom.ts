import { Schema, model, InferSchemaType } from 'mongoose';

const PromSchema = new Schema({
    disease: { type: Schema.Types.ObjectId, ref: "Disease", required: true },
    name: { type: String, required: true },
    questions: [
        {
          questionText: { type: String, required: true },
          score: { type: Number, default: 0, min: 0, max: 5 }, // Default score is 0
        },
      ],
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

type Prom = InferSchemaType<typeof PromSchema>;

export default model<Prom>('Prom', PromSchema);