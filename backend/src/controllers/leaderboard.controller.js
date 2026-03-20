import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/user.model.js";

export const getCoinsLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .sort({ totalCoins: -1 })
    .limit(100)
    .select("name totalCoins gamesPlayed gamesWon")
    .lean();

  res.status(200).json({ status: "success", data: { users } });
});

export const getRatioLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({ gamesPlayed: { $gte: 5 } })
    .sort({ coinRatio: -1 })
    .limit(100)
    .select("name coinRatio totalCoins gamesPlayed")
    .lean();

  res.status(200).json({ status: "success", data: { users } });
});
