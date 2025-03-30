import { Schema, model, InferSchemaType } from "mongoose";

const AdminSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

type Admin = InferSchemaType<typeof AdminSchema>;

export default model<Admin>("Admin", AdminSchema); 