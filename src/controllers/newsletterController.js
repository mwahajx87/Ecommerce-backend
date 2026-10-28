import { Subscriber } from "../models/Subscriber.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const subscribe = asyncHandler(async (req, res) => {
  const existing = await Subscriber.exists({ email: req.body.email });
  if (existing) {
    return res.json({ message: "You are already subscribed" });
  }
  try {
    await Subscriber.create({ email: req.body.email });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.json({ message: "You are already subscribed" });
    }
    throw error;
  }
  res.status(201).json({ message: "Subscribed successfully" });
});
