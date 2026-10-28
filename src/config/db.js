import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }
  await mongoose.connect(env.mongoUri);
}
