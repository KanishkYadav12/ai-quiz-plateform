import { Quiz } from "../models/quiz.model.js";
import { Room } from "../models/room.model.js";
import { BadRequestException } from "../utils/exceptions.js";
import { generateQuestionsFromAI } from "../config/groq.config.js";
import { NotFoundException, ForbiddenException } from "../utils/exceptions.js";
import { createRoom, expireStaleWaitingRooms } from "./room.service.js";

export const createQuizWithAI = async (payload, userId) => {
  const {
    title,
    topic,
    difficulty,
    totalQuestions,
    timePerQuestion,
    isPublic,
    creationMode,
  } = payload;

  const questions = await generateQuestionsFromAI({
    topic,
    difficulty,
    count: totalQuestions,
  });

  const quiz = await Quiz.create({
    createdBy: userId,
    title,
    topic,
    difficulty,
    totalQuestions,
    timePerQuestion,
    questions,
    isPublic,
    creationMode,
    status: "waiting",
  });

  const room = await createRoom({ quizId: quiz._id, hostId: userId });

  return { quiz, room };
};

export const getQuizAnalytics = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  if (!quiz.status) {
    quiz.status = "waiting";
  }

  if (quiz.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenException("Only the host can view detailed analytics.");
  }

  // Get all completed rooms for this quiz
  const rooms = await Room.find({ quizId, status: "completed" })
    .populate("players.userId", "name")
    .sort({ completedAt: -1 })
    .lean();

  // Calculate "Most Missed Question"
  const questionStats = quiz.questions.map((_, index) => ({
    index,
    correctCount: 0,
    totalAnswers: 0,
  }));

  rooms.forEach((room) => {
    room.players.forEach((player) => {
      player.answers.forEach((answer) => {
        const stat = questionStats.find(
          (s) => s.index === answer.questionIndex,
        );
        if (stat) {
          stat.totalAnswers += 1;
          if (answer.isCorrect) stat.correctCount += 1;
        }
      });
    });
  });

  const mostMissed = questionStats
    .filter((s) => s.totalAnswers > 0)
    .sort(
      (a, b) =>
        a.correctCount / a.totalAnswers - b.correctCount / b.totalAnswers,
    )[0];

  return {
    quiz,
    rooms,
    stats: {
      timesPlayed: quiz.timesPlayed,
      totalParticipants: quiz.totalParticipants,
      averageScore:
        quiz.timesPlayed > 0 ? quiz.totalScoreSum / quiz.timesPlayed : 0,
      highestScore: quiz.highestScore,
      mostMissedQuestion: mostMissed
        ? {
            ...quiz.questions[mostMissed.index].toObject(),
            correctRate:
              (mostMissed.correctCount / mostMissed.totalAnswers) * 100,
          }
        : null,
    },
  };
};

export const getQuizzesByUser = (userId) =>
  (async () => {
    await expireStaleWaitingRooms();

    const quizzes = await Quiz.find({ createdBy: userId })
      .select("-questions")
      .sort({ createdAt: -1 })
      .lean();

    const quizIds = quizzes.map((q) => q._id);
    const rooms = await Room.find({
      quizId: { $in: quizIds },
      status: { $in: ["waiting", "active"] },
    })
      .select("quizId roomCode status joinable createdAt startedAt")
      .sort({ createdAt: -1 })
      .lean();

    const latestRoomByQuiz = new Map();
    for (const room of rooms) {
      const key = room.quizId.toString();
      if (!latestRoomByQuiz.has(key)) {
        latestRoomByQuiz.set(key, room);
      }
    }

    return quizzes.map((quiz) => ({
      ...quiz,
      status: quiz.status || "waiting",
      currentRoom: latestRoomByQuiz.get(quiz._id.toString()) || null,
    }));
  })();

export const getPublicQuizzes = (userId) =>
  Quiz.find({
    isPublic: true,
    createdBy: { $ne: userId },
    status: { $nin: ["completed", "expired"] },
  })
    .select("-questions")
    .populate("createdBy", "name")
    .sort({ timesPlayed: -1 })
    .lean();

export const getQuizById = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  // Allow access if owner or if quiz is public
  const isOwner = quiz.createdBy.toString() === userId.toString();
  const quizStatus = quiz.status || "waiting";
  const isClosed = ["completed", "expired"].includes(quizStatus);

  if (!isOwner && isClosed) {
    throw new ForbiddenException(
      "You do not have permission to view this quiz.",
    );
  }

  if (!isOwner && !quiz.isPublic) {
    throw new ForbiddenException(
      "You do not have permission to view this quiz.",
    );
  }

  // Strip questions for public view if not the owner
  if (!isOwner && quiz.isPublic) {
    const publicQuiz = quiz.toObject();
    publicQuiz.status = quizStatus;
    delete publicQuiz.questions;
    return publicQuiz;
  }

  if (quiz.status !== quizStatus) {
    quiz.status = quizStatus;
  }

  return quiz;
};

export const deleteQuizById = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  if (quiz.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenException("You can only delete your own quizzes.");
  }

  await quiz.deleteOne();
};

export const rateQuiz = async (quizId, userId, score) => {
  if (!score || score < 1 || score > 5) {
    throw new BadRequestException("Rating must be between 1 and 5");
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found");

  if (quiz.createdBy.toString() === userId.toString()) {
    throw new BadRequestException("You cannot rate your own quiz");
  }

  const existingRating = quiz.ratings.find(
    (r) => r.userId.toString() === userId.toString(),
  );

  if (existingRating) {
    existingRating.score = score;
  } else {
    quiz.ratings.push({ userId, score });
  }

  await quiz.save();
  return quiz;
};

export const toggleQuizPublic = async (quizId, userId, isPublic) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  if (quiz.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenException("You can only update your own quizzes.");
  }

  quiz.isPublic = isPublic;
  await quiz.save();

  return quiz;
};

export const cloneQuizById = async (quizId, userId, creationMode) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  if (quiz.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenException("You can only clone your own quizzes.");
  }

  const clone = await Quiz.create({
    createdBy: userId,
    title: `${quiz.title} (Copy)`,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    totalQuestions: quiz.totalQuestions,
    timePerQuestion: quiz.timePerQuestion,
    questions: quiz.questions,
    isPublic: quiz.isPublic,
    creationMode,
    status: "waiting",
    timesPlayed: 0,
    totalParticipants: 0,
    totalScoreSum: 0,
    highestScore: 0,
    ratings: [],
    currentRoomId: null,
    completedAt: null,
    expiredAt: null,
  });

  const room = await createRoom({ quizId: clone._id, hostId: userId });
  return { quiz: clone, room };
};
