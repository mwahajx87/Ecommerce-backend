import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { sessionCookieName } from "../middleware/auth.js";
import { randomUUID } from "node:crypto";

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  joinedDate: user.joinedDate,
  status: user.status,
  avatar: user.avatar,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (
    !user ||
    user.status !== "Active" ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

  res.cookie(sessionCookieName, accessToken, cookieOptions());
  res.json({ user: publicUser(user), accessToken });
});

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (
    !name ||
    name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 12
  ) {
    throw new HttpError(
      400,
      "A valid name and email and a password of at least 12 characters are required.",
    );
  }

  const user = await User.create({
    id: `usr-${randomUUID()}`,
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "customer",
    joinedDate: new Date().toISOString().slice(0, 10),
    status: "Active",
  });
  res.status(201).json({ user: publicUser(user) });
});

export const currentUser = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const customerSession = asyncHandler(async (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/",
  });
  res.status(204).end();
});
