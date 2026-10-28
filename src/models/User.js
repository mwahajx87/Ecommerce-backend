import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "customer"], default: "customer", required: true },
  status: { type: String, enum: ["Active", "Suspended"], default: "Active", required: true },
  avatar: { type: String, default: "" }
}, { timestamps: true });

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
