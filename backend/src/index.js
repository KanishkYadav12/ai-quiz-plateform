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
import { registerSocketHandlers } from "./socket/socket.handler.js";

const PORT = getEnv("PORT", "8000");
const FRONTEND_ORIGIN = getEnv("FRONTEND_ORIGIN", "http://localhost:3000");
const NODE_ENV = getEnv("NODE_ENV", "development");

// ── Express app ────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
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
        origin: FRONTEND_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    registerSocketHandlers(io);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌍 Accepting requests from: ${FRONTEND_ORIGIN}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

bootstrap();
