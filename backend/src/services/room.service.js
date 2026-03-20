import { Room } from "../models/room.model.js";
import { Quiz } from "../models/quiz.model.js";
import { NotFoundException, BadRequestException } from "../utils/exceptions.js";

// ── Helpers ────────────────────────────────────────────────────

const generateRoomCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getUniqueRoomCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const exists = await Room.exists({ roomCode: code });
    if (!exists) return code;
  }
  throw new BadRequestException(
    "Unable to generate a unique room code. Please try again.",
  );
};

// ── Service functions ──────────────────────────────────────────

export const createRoom = async ({ quizId, hostId }) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  const roomCode = await getUniqueRoomCode();

  const room = await Room.create({ quizId, hostId, roomCode });
  return room;
};

export const getRoomByCode = async (roomCode) => {
  const room = await Room.findOne({ roomCode })
    .populate("quizId")
    .populate("hostId", "name email");

  if (!room) throw new NotFoundException(`Room "${roomCode}" not found.`);
  return room;
};

export const getRoomsByHost = (hostId) =>
  Room.find({ hostId })
    .populate("quizId", "title topic difficulty totalQuestions")
    .sort({ createdAt: -1 })
    .lean();

export const getRoomsByParticipant = (userId) =>
  Room.find({ "players.userId": userId })
    .populate("quizId", "title topic difficulty totalQuestions")
    .populate("hostId", "name")
    .sort({ createdAt: -1 })
    .lean();

export const updateRoomStatus = async (roomCode, status) => {
  const room = await Room.findOne({ roomCode });
  if (!room) throw new NotFoundException("Room not found.");

  room.status = status;
  if (status === "active") room.startedAt = new Date();
  if (status === "completed") room.completedAt = new Date();

  await room.save();
  return room;
};

export const savePlayerToRoom = async (roomCode, playerData) => {
  const room = await Room.findOne({ roomCode });
  if (!room) throw new NotFoundException("Room not found.");

  const existing = room.players.find(
    (p) => p.userId.toString() === playerData.userId.toString(),
  );

  if (existing) {
    // Rejoin — update socket and connection status
    existing.socketId = playerData.socketId;
    existing.isConnected = true;
    existing.name = playerData.name;
  } else {
    room.players.push({
      userId: playerData.userId,
      name: playerData.name,
      socketId: playerData.socketId,
      isConnected: true,
      isReady: false,
      joinedAt: new Date(),
    });
  }

  await room.save();
  return room;
};

export const saveFinalScoresToRoom = async (roomCode, players) => {
  const room = await Room.findOne({ roomCode });
  if (!room) return;

  for (const player of room.players) {
    const livePlayer = players.find(
      (p) => p.userId.toString() === player.userId.toString(),
    );
    if (livePlayer) {
      player.score = livePlayer.score ?? player.score;
      player.answers = livePlayer.answers ?? player.answers;
    }
  }

  room.status = "completed";
  room.completedAt = new Date();
  await room.save();
};
