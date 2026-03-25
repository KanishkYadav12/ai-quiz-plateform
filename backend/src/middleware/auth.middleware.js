import { User } from "../models/user.model.js";
import { verifyToken } from "../utils/jwt.util.js";
import { UnauthorizedException } from "../utils/exceptions.js";
import { asyncHandler } from "./asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie || "";

  const cookieToken = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith("token="))
    ?.split("=")[1];

  let token = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (cookieToken) {
    token = decodeURIComponent(cookieToken);
  }

  if (!token) {
    throw new UnauthorizedException("No token provided. Please log in.");
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new UnauthorizedException(
      "Invalid or expired token. Please log in again.",
    );
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw new UnauthorizedException(
      "The user belonging to this token no longer exists.",
    );
  }

  req.user = user;
  next();
});
