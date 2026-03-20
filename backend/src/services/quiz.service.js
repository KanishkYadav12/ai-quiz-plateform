import { Quiz } from "../models/quiz.model.js";
import { Room } from "../models/room.model.js";
import { generateQuestionsFromAI } from "../config/groq.config.js";
import { NotFoundException, ForbiddenException } from "../utils/exceptions.js";

export const createQuizWithAI = async (payload, userId) => {
  const {
    title,
    topic,
    difficulty,
    totalQuestions,
    timePerQuestion,
    isPublic,
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
  });

  return quiz;
};

export const getQuizAnalytics = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

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
        const stat = questionStats.find((s) => s.index === answer.questionIndex);
        if (stat) {
          stat.totalAnswers += 1;
          if (answer.isCorrect) stat.correctCount += 1;
        }
      });
    });
  });

  const mostMissed = questionStats
    .filter((s) => s.totalAnswers > 0)
    .sort((a, b) => a.correctCount / a.totalAnswers - b.correctCount / b.totalAnswers)[0];

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
            correctRate: (mostMissed.correctCount / mostMissed.totalAnswers) * 100,
          }
        : null,
    },
  };
};

export const getQuizzesByUser = (userId) =>
  Quiz.find({ createdBy: userId })
    .select("-questions") // don't return full question list on dashboard
    .sort({ createdAt: -1 })
    .lean();

export const getPublicQuizzes = (userId) =>
  Quiz.find({ isPublic: true, createdBy: { $ne: userId } })
    .select("-questions")
    .populate("createdBy", "name")
    .sort({ timesPlayed: -1 })
    .lean();

export const getQuizById = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new NotFoundException("Quiz not found.");

  // Allow access if owner or if quiz is public
  const isOwner = quiz.createdBy.toString() === userId.toString();
  if (!isOwner && !quiz.isPublic) {
    throw new ForbiddenException(
      "You do not have permission to view this quiz.",
    );
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
