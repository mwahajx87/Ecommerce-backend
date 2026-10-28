import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  joinedDate: user.joinedDate,
  status: user.status,
  avatar: user.avatar,
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("id name email role joinedDate status avatar")
    .sort({ createdAt: -1 })
    .lean();
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const { role, status } = req.body;
  if (
    !["admin", "customer"].includes(role) ||
    !["Active", "Suspended"].includes(status)
  ) {
    throw new HttpError(400, "A valid role and account status are required.");
  }
  if (req.params.id === req.user.id && (role !== "admin" || status !== "Active")) {
    throw new HttpError(400, "You cannot revoke your own active administrator access.");
  }

  const user = await User.findOneAndUpdate(
    { id: req.params.id },
    { role, status },
    { new: true, runValidators: true },
  ).select("id name email role joinedDate status avatar");
  if (!user) throw new HttpError(404, "User not found.");
  res.json(serializeUser(user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new HttpError(400, "You cannot delete your own account.");
  }
  const user = await User.findOneAndDelete({ id: req.params.id });
  if (!user) throw new HttpError(404, "User not found.");
  res.status(204).end();
});
