import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createRoom,
  getRoomByCode,
  getRoomsByHost,
  getRoomsByParticipant,
} from "../services/room.service.js";

export const createRoomController = asyncHandler(async (req, res) => {
  const { quizId } = req.body;
  const room = await createRoom({ quizId, hostId: req.user._id });
  res.status(201).json({ status: "success", data: { room } });
});

export const getRoomController = asyncHandler(async (req, res) => {
  const room = await getRoomByCode(req.params.roomCode);
  res.status(200).json({ status: "success", data: { room } });
});

export const getMyRoomsController = asyncHandler(async (req, res) => {
  const rooms = await getRoomsByHost(req.user._id);
  res.status(200).json({ status: "success", data: { rooms } });
});

export const getRoomHistoryController = asyncHandler(async (req, res) => {
  const rooms = await getRoomsByParticipant(req.user._id);
  res.status(200).json({ status: "success", data: { rooms } });
});
