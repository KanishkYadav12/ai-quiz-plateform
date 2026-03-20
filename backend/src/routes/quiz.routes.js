import { Router } from "express";
import {
  generateQuiz,
  getMyQuizzes,
  getQuiz,
  deleteQuiz,
  publishQuiz,
  getPublicQuizzesController,
  getQuizAnalyticsController,
  rateQuizController,
} from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: "error",
    errorCode: "AI_RATE_LIMITED",
    message: "AI generation quota exceeded. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// All quiz routes require authentication
router.use(protect);

router.post("/generate", aiLimiter, generateQuiz);
router.get("/public", getPublicQuizzesController);
router.get("/my-quizzes", getMyQuizzes);
router.get("/:quizId", getQuiz);
router.get("/:quizId/analytics", getQuizAnalyticsController);
router.delete("/:quizId", deleteQuiz);
router.patch("/:quizId/publish", publishQuiz);
router.post("/:quizId/rate", rateQuizController);

export default router;
