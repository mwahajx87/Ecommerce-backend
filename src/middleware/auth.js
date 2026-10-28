import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

export const sessionCookieName = "admin_session";

const authenticatedUser = async (req) => {
  const token =
    req.cookies?.[sessionCookieName] ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new HttpError(401, "Authentication is required.");
  }

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Your session is invalid or has expired.");
  }

  const user = await User.findOne({ id: claims.sub }).select(
    "id name email role joinedDate status avatar",
  );
  if (!user || user.status !== "Active") {
    throw new HttpError(401, "This account is unavailable.");
  }
  return user;
};

export const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await authenticatedUser(req);
  if (user.role !== "admin") {
    throw new HttpError(403, "Administrator access is required.");
  }

  req.user = user;
  next();
});

export const requireCustomer = asyncHandler(async (req, res, next) => {
  const user = await authenticatedUser(req);
  if (user.role !== "customer") {
    throw new HttpError(403, "Customer access is required.");
  }
  req.user = user;
  next();
});

export const optionalCustomer = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.[sessionCookieName] ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    next();
    return;
  }
  try {
    const user = await authenticatedUser(req);
    if (user.role === "customer") req.user = user;
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 401) throw error;
  }
  next();
});

export const requireAdmin = isAdmin;
