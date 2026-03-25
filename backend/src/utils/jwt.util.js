import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.config.js";

const JWT_SECRET = getEnv("JWT_SECRET");
const JWT_EXPIRES_IN = getEnv("JWT_EXPIRES_IN", "7d");

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
