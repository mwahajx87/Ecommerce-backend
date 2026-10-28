import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeUser } from "../utils/serialize.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production" || env.cookieSameSite === "none",
  sameSite: env.cookieSameSite,
  path: "/api",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "7d" });
  res.cookie("shopco_session", token, cookieOptions);
}

export const register = asyncHandler(async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash,
    role: "customer",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.name)}`
  });
  setSessionCookie(res, user);
  res.status(201).json({ user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.status === "Suspended") {
    return res.status(403).json({ message: "This account is suspended" });
  }
  setSessionCookie(res, user);
  res.json({ user: serializeUser(user) });
});

export function logout(req, res) {
  res.clearCookie("shopco_session", {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path
  });
  res.status(204).end();
}

export function currentUser(req, res) {
  res.json({ user: serializeUser(req.user) });
}
