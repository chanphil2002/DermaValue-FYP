import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
}

const ServiceSchema = new Schema<IService>({
  name: { type: String, required: true },
});

export default mongoose.model<IService>("Service", ServiceSchema);