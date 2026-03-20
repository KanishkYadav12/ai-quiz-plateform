import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  generateQuizSchema,
  publishSchema,
} from "../validators/quiz.validator.js";
import {
  createQuizWithAI,
  getQuizzesByUser,
  getQuizById,
  deleteQuizById,
  toggleQuizPublic,
  getPublicQuizzes,
  getQuizAnalytics,
} from "../services/quiz.service.js";

export const generateQuiz = asyncHandler(async (req, res) => {
  const body = generateQuizSchema.parse(req.body);
  const quiz = await createQuizWithAI(body, req.user._id);
  res.status(201).json({ status: "success", data: { quiz } });
});

export const getMyQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await getQuizzesByUser(req.user._id);
  res.status(200).json({ status: "success", data: { quizzes } });
});

export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await getQuizById(req.params.quizId, req.user._id);
  res.status(200).json({ status: "success", data: { quiz } });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  await deleteQuizById(req.params.quizId, req.user._id);
  res
    .status(200)
    .json({
      status: "success",
      data: { message: "Quiz deleted successfully." },
    });
});

export const publishQuiz = asyncHandler(async (req, res) => {
  const { isPublic } = publishSchema.parse(req.body);
  const quiz = await toggleQuizPublic(
    req.params.quizId,
    req.user._id,
    isPublic,
  );
  res.status(200).json({ status: "success", data: { quiz } });
});

export const getPublicQuizzesController = asyncHandler(async (req, res) => {
  const quizzes = await getPublicQuizzes(req.user._id);
  res.status(200).json({ status: "success", data: { quizzes } });
});

export const getQuizAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getQuizAnalytics(req.params.quizId, req.user._id);
  res.status(200).json({ status: "success", data: { analytics } });
});
