import { Router } from "express";
import {
  generateQuiz,
  getMyQuizzes,
  getQuiz,
  deleteQuiz,
  publishQuiz,
  getPublicQuizzesController,
  getQuizAnalyticsController,
} from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All quiz routes require authentication
router.use(protect);

router.post("/generate", generateQuiz);
router.get("/public", getPublicQuizzesController);
router.get("/my-quizzes", getMyQuizzes);
router.get("/:quizId", getQuiz);
router.get("/:quizId/analytics", getQuizAnalyticsController);
router.delete("/:quizId", deleteQuiz);
router.patch("/:quizId/publish", publishQuiz);

export default router;
