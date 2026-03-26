import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: String, default: null },
    isCorrect: { type: Boolean, required: true },
    timeTaken: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    score: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] },
    isReady: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
    socketId: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomCode: { type: String, required: true, unique: true, length: 6 },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "expired"],
      default: "waiting",
    },
    creationMode: {
      type: String,
      enum: ["play_now", "schedule_later"],
      default: "play_now",
    },
    joinable: { type: Boolean, default: true },
    players: { type: [playerSchema], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    finalResult: { type: mongoose.Schema.Types.Mixed, default: null },
    activatedAt: { type: Date, default: null },
    startedAt: { type: Date },
    completedAt: { type: Date },
    expiredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

roomSchema.index({ hostId: 1, createdAt: -1 });
roomSchema.index({ "players.userId": 1 });
roomSchema.index({ quizId: 1, status: 1, createdAt: -1 });

export const Room = mongoose.model("Room", roomSchema);
