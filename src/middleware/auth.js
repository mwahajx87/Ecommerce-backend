import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function loadSessionUser(req) {
  const token = req.cookies?.shopco_session;
  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }

  const user = await User.findById(payload.sub);
  return user?.status === "Active" ? user : null;
}

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.shopco_session;
  if (token) {
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(payload.sub);
    if (!user || user.status !== "Active") {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = user;
  }
  next();
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  req.user = await loadSessionUser(req);
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
});

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
