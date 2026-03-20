import { Quiz } from "../models/quiz.model.js";
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

export const getQuizzesByUser = (userId) =>
  Quiz.find({ createdBy: userId })
    .select("-questions") // don't return full question list on dashboard
    .sort({ createdAt: -1 })
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
