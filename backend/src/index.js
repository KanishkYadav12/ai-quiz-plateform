import "./config/env.config.js"; // validates all env vars before anything else
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.config.js";
import { getEnv } from "./config/env.config.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import roomRoutes from "./routes/room.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import { registerSocketHandlers } from "./socket/socket.handler.js";
import { expireStaleWaitingRooms } from "./services/room.service.js";

const PORT = getEnv("PORT", "8000");
const NODE_ENV = getEnv("NODE_ENV", "development");
const normalizeOrigin = (origin) => origin.replace(/\/$/, "");
const FRONTEND_ORIGINS = getEnv(
  "FRONTEND_ORIGIN",
  "https://ai-quiz-plateform.vercel.app,http://localhost:3000,http://localhost:3001",
)
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);
const LOCAL_DEV_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];
const ALLOWED_ORIGINS =
  NODE_ENV === "development"
    ? [
        ...new Set(
          [...FRONTEND_ORIGINS, ...LOCAL_DEV_ORIGINS].map(normalizeOrigin),
        ),
      ]
    : FRONTEND_ORIGINS;

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Allow non-browser clients/tools that do not send an Origin header.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(normalizeOrigin(origin)))
      return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

// ── Express app ────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health check ───────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "AI Quiz Platform API is running",
    env: NODE_ENV,
  });
});

// ── API routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/user", userRoutes);

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    errorCode: "NOT_FOUND",
    message: "Route not found.",
  });
});

// ── Global error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ──────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    registerSocketHandlers(io);

    setInterval(async () => {
      try {
        await expireStaleWaitingRooms();
      } catch (err) {
        console.error("[Lifecycle] Expiry sweep failed:", err.message);
      }
    }, 60 * 1000);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌍 Accepting requests from: ${ALLOWED_ORIGINS.join(", ")}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

bootstrap();
