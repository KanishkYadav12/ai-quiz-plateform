import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createRoom,
  activateRoom,
  getRoomByCode,
  getRoomsByHost,
  getRoomsByParticipant,
  getLiveRooms,
  expireStaleWaitingRooms,
} from "../services/room.service.js";

export const createRoomController = asyncHandler(async (req, res) => {
  const { quizId } = req.body;
  const room = await createRoom({ quizId, hostId: req.user._id });
  res.status(201).json({ status: "success", data: { room } });
});

export const activateRoomController = asyncHandler(async (req, res) => {
  const room = await activateRoom({
    roomCode: req.params.roomCode,
    hostId: req.user._id,
  });
  res.status(200).json({ status: "success", data: { room } });
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

export const getLiveRoomsController = asyncHandler(async (req, res) => {
  await expireStaleWaitingRooms();
  const rooms = await getLiveRooms();
  res.status(200).json({ status: "success", data: { rooms } });
});
