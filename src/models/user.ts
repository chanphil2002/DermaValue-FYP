import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: "admin" | "clinician" | "patient";
  }

  const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hash before saving
    role: { type: String, enum: ["admin", "clinician", "patient"], required: true },
  });

  export default mongoose.model<IUser>("User", UserSchema);