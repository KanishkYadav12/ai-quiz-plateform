import { Router } from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/profile/:userId", getProfile);
router.patch("/profile", updateProfile);

export default router;
