import { NewsletterSubscription } from "../models/NewsletterSubscription.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    throw new HttpError(400, "A valid email address is required.");
  }

  await NewsletterSubscription.updateOne(
    { email },
    { $setOnInsert: { email } },
    { upsert: true },
  );
  res.status(200).json({ message: "Thanks for subscribing." });
});
