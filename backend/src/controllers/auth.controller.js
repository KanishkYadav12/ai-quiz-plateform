import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import { getEnv } from "../config/env.config.js";

const NODE_ENV = getEnv("NODE_ENV", "development");
const TOKEN_COOKIE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    maxAge: TOKEN_COOKIE_AGE_MS,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    httpOnly: false,
  });
};

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await registerUser(body);
  setAuthCookie(res, result.token);
  res.status(201).json({ status: "success", data: result });
});

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await loginUser(body);
  setAuthCookie(res, result.token);
  res.status(200).json({ status: "success", data: result });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
});
