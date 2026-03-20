import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.util.js";
import {
  ConflictException,
  UnauthorizedException,
} from "../utils/exceptions.js";

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing)
    throw new ConflictException("An account with this email already exists.");

  const user = await User.create({ name, email, password });
  const token = signToken({ id: user._id });

  return { user: user.omitPassword(), token };
};

export const loginUser = async ({ email, password }) => {
  // Must select +password because it is excluded by default
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new UnauthorizedException("Invalid email or password.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new UnauthorizedException("Invalid email or password.");

  const token = signToken({ id: user._id });

  return { user: user.omitPassword(), token };
};
