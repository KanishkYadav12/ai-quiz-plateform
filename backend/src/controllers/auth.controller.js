import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await registerUser(body);
  res.status(201).json({ status: "success", data: result });
});

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await loginUser(body);
  res.status(200).json({ status: "success", data: result });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
});
