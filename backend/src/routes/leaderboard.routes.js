import { Router } from "express";
import {
  getCoinsLeaderboard,
  getRatioLeaderboard,
} from "../controllers/leaderboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/coins", getCoinsLeaderboard);
router.get("/ratio", getRatioLeaderboard);

export default router;
