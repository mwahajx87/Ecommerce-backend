import mongoose from "mongoose";
import { HttpError } from "../utils/httpError.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status =
    error instanceof HttpError
      ? error.status
      : error instanceof mongoose.Error.ValidationError
        ? 400
        : error instanceof mongoose.Error.CastError
          ? 400
          : error.code === 11000
            ? 409
            : 500;
  const message =
    error instanceof HttpError
      ? error.message
      : error.code === 11000
        ? "A record with that unique value already exists."
        : status === 400
          ? error.message
          : "An unexpected server error occurred.";

  if (status === 500) console.error(error);
  res.status(status).json({ message });
}
