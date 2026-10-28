import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { serializeUser } from "../utils/serialize.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(serializeUser));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");

  const isSelf = user._id.equals(req.user._id);
  if (isSelf && (req.body.role === "customer" || req.body.status === "Suspended")) {
    throw new HttpError(409, "You cannot demote or suspend your own account");
  }

  const removesActiveAdmin = user.role === "admin"
    && user.status === "Active"
    && ((req.body.role !== undefined && req.body.role !== "admin")
      || (req.body.status !== undefined && req.body.status !== "Active"));
  if (removesActiveAdmin) {
    const activeAdmins = await User.countDocuments({ role: "admin", status: "Active" });
    if (activeAdmins <= 1) {
      throw new HttpError(409, "The last active admin cannot be removed");
    }
  }

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.status !== undefined) user.status = req.body.status;
  await user.save();
  res.json(serializeUser(user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  if (user._id.equals(req.user._id)) {
    throw new HttpError(409, "You cannot delete your own account");
  }
  if (user.role === "admin" && user.status === "Active") {
    const activeAdmins = await User.countDocuments({ role: "admin", status: "Active" });
    if (activeAdmins <= 1) {
      throw new HttpError(409, "The last active admin cannot be removed");
    }
  }
  await user.deleteOne();
  res.status(204).end();
});
