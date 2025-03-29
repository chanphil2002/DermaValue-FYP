import mongoose, { Schema, model, InferSchemaType } from "mongoose";
import bcrypt from "bcrypt";
import { UserRole } from "../enums/userRole";
 
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hash before saving
  role: { type: String, enum: Object.values(UserRole), required: true },
});

// **Hash password before saving**
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  // **Compare password for login**
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
  };

// **Infer TypeScript type from schema**
type User = InferSchemaType<typeof UserSchema> & {
    comparePassword: (candidatePassword: string) => Promise<boolean>;
  };

export default model<User>("User", UserSchema);
