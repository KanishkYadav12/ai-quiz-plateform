import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Room } from "../models/room.model.js";
import { NotFoundException } from "../utils/exceptions.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("-password");
  if (!user) throw new NotFoundException("User not found");

  // Get last 10 games
  const history = await Room.find({ "players.userId": user._id, status: "completed" })
    .populate("quizId", "title topic difficulty totalQuestions")
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  const formattedHistory = history.map(room => {
    const playerStats = room.players.find(p => p.userId.toString() === user._id.toString());
    const sortedPlayers = [...room.players].sort((a,b) => b.score - a.score);
    const placement = sortedPlayers.findIndex(p => p.userId.toString() === user._id.toString()) + 1;

    return {
        roomCode: room.roomCode,
        quizTitle: room.quizId?.title || "Deleted Quiz",
        topic: room.quizId?.topic,
        date: room.completedAt,
        score: playerStats?.score || 0,
        placement,
        totalPlayers: room.players.length,
        isDisqualified: playerStats?.isDisqualified || false
    };
  });

  res.status(200).json({
    status: "success",
    data: {
        user,
        recentGames: formattedHistory
    }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
    // Optional: for name changes or avatar color in the future
    res.status(200).json({ status: "success", data: { message: "Not implemented" } });
});
