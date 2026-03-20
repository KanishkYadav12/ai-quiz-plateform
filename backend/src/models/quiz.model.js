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
  },
  { timestamps: true },
);

// Index for fetching quizzes by owner efficiently
quizSchema.index({ createdBy: 1, createdAt: -1 });

export const Quiz = mongoose.model("Quiz", quizSchema);
