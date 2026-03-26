import { Room } from "../models/room.model.js";
import { Quiz } from "../models/quiz.model.js";
import { NotFoundException, BadRequestException } from "../utils/exceptions.js";

const LOBBY_EXPIRY_MS = 30 * 60 * 1000;

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

  if (quiz.createdBy.toString() !== hostId.toString()) {
    throw new BadRequestException("Only the quiz host can create a room.");
  }

  const quizStatus = quiz.status || "waiting";

  if (quizStatus === "completed" || quizStatus === "expired") {
    throw new BadRequestException(
      "This quiz is closed. Clone it to host a fresh room.",
    );
  }

  const existing = await Room.findOne({
    quizId,
    status: { $in: ["waiting", "active"] },
  }).sort({ createdAt: -1 });

  if (existing) {
    return existing;
  }

  const creationMode =
    quiz.creationMode === "schedule_later" ? "schedule_later" : "play_now";
  const joinable = creationMode === "play_now";

  const roomCode = await getUniqueRoomCode();

  const room = await Room.create({
    quizId,
    hostId,
    roomCode,
    status: "waiting",
    creationMode,
    joinable,
    activatedAt: joinable ? new Date() : null,
  });

  quiz.status = "waiting";
  quiz.currentRoomId = room._id;
  quiz.completedAt = null;
  quiz.expiredAt = null;
  await quiz.save();

  return room;
};

export const activateRoom = async ({ roomCode, hostId }) => {
  const room = await Room.findOne({ roomCode });
  if (!room) throw new NotFoundException("Room not found.");

  if (room.hostId.toString() !== hostId.toString()) {
    throw new BadRequestException("Only the host can activate this room.");
  }

  if (room.status !== "waiting") {
    throw new BadRequestException("Only waiting rooms can be activated.");
  }

  if (!room.joinable) {
    room.joinable = true;
    room.activatedAt = new Date();
    await room.save();
  }

  const quiz = await Quiz.findById(room.quizId);
  if (quiz) {
    quiz.status = "waiting";
    quiz.currentRoomId = room._id;
    quiz.expiredAt = null;
    await quiz.save();
  }

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

export const getLiveRooms = () =>
  Room.find({ status: { $in: ["waiting", "active"] } })
    .populate("quizId", "title topic difficulty totalQuestions status")
    .populate("hostId", "name")
    .sort({ createdAt: -1 })
    .lean();

export const updateRoomStatus = async (roomCode, status) => {
  const room = await Room.findOne({ roomCode });
  if (!room) throw new NotFoundException("Room not found.");

  room.status = status;
  if (status === "active") {
    room.joinable = true;
    room.startedAt = new Date();
    room.activatedAt = room.activatedAt || new Date();
  }
  if (status === "completed") room.completedAt = new Date();
  if (status === "expired") {
    room.joinable = false;
    room.expiredAt = new Date();
  }

  await room.save();

  const quiz = await Quiz.findById(room.quizId);
  if (quiz) {
    if (status === "active") {
      quiz.status = "active";
      quiz.currentRoomId = room._id;
    }

    if (status === "completed") {
      quiz.status = "completed";
      quiz.currentRoomId = null;
      quiz.completedAt = room.completedAt || new Date();
    }

    if (status === "expired") {
      quiz.status = "expired";
      quiz.currentRoomId = null;
      quiz.expiredAt = room.expiredAt || new Date();
    }

    await quiz.save();
  }

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

export const touchRoomActivity = async (roomCode) => {
  await Room.updateOne(
    { roomCode, status: "waiting" },
    { $set: { updatedAt: new Date() } },
  );
};

export const saveFinalScoresToRoom = async (
  roomCode,
  players,
  finalResult = null,
) => {
  const room = await Room.findOne({ roomCode });
  if (!room) return;

  // Persist the authoritative runtime snapshot so all clients can load the
  // same completed result even after refresh/reconnect.
  room.players = players.map((p) => ({
    userId: p.userId,
    name: p.name,
    score: p.score,
    answers: (p.answers || []).map((a) => ({
      questionIndex: a.questionIndex,
      selectedAnswer: a.selectedAnswer ?? null,
      isCorrect: a.isCorrect,
      timeTaken: a.timeTaken,
      pointsEarned: a.pointsEarned,
    })),
    isReady: p.isReady,
    isConnected: false,
    socketId: null,
    joinedAt: p.joinedAt || new Date(),
  }));

  room.finalResult = finalResult;

  room.status = "completed";
  room.completedAt = new Date();
  await room.save();

  const quiz = await Quiz.findById(room.quizId);
  if (quiz) {
    quiz.status = "completed";
    quiz.currentRoomId = null;
    quiz.completedAt = room.completedAt;
    await quiz.save();
  }
};

export const expireStaleWaitingRooms = async () => {
  const cutoff = new Date(Date.now() - LOBBY_EXPIRY_MS);

  const staleRooms = await Room.find({
    status: "waiting",
    updatedAt: { $lte: cutoff },
  }).select("_id quizId");

  if (staleRooms.length === 0) return { expiredRooms: 0 };

  const roomIds = staleRooms.map((r) => r._id);
  const quizIds = staleRooms.map((r) => r.quizId);

  const now = new Date();
  await Room.updateMany(
    { _id: { $in: roomIds } },
    {
      $set: {
        status: "expired",
        joinable: false,
        expiredAt: now,
      },
    },
  );

  await Quiz.updateMany(
    { _id: { $in: quizIds }, status: { $in: ["waiting", "active"] } },
    {
      $set: {
        status: "expired",
        currentRoomId: null,
        expiredAt: now,
      },
    },
  );

  return { expiredRooms: staleRooms.length };
};
