import { HttpError } from "../utils/httpError.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error.name === "ZodError") {
    return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists" });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }

  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid data" });
  }

  const status = error.statusCode ?? error.status;
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 429) {
    return res.status(status).json({ message: error.message });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }
  return res.status(500).json({ message: "Internal server error" });
}
