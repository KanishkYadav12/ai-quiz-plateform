import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: "A question must have exactly 4 options",
      },
    },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    totalQuestions: { type: Number, required: true },
    timePerQuestion: { type: Number, default: 30 }, // seconds
    questions: { type: [questionSchema], required: true },
    isPublic: { type: Boolean, default: false },
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
    currentRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    completedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },

    // Analytics (updated after every game_over)
    timesPlayed: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    totalScoreSum: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },

    // Rating (Section 11)
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

quizSchema.virtual("ratingInfo").get(function () {
  if (!this.ratings || this.ratings.length === 0) {
    return { average: 0, count: 0 };
  }
  const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
  return {
    average: total / this.ratings.length,
    count: this.ratings.length,
  };
});

// Index for fetching quizzes by owner efficiently
quizSchema.index({ createdBy: 1, createdAt: -1 });
quizSchema.index({ createdBy: 1, status: 1, createdAt: -1 });

export const Quiz = mongoose.model("Quiz", quizSchema);
