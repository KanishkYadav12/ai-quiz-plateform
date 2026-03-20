import {
  createRoomState,
  getRoomState,
  deleteRoomState,
  findRoomBySocketId,
  upsertPlayer,
  removePlayer,
  setPlayerReady,
  recordAnswer,
  getLeaderboard,
  getAllPlayers,
} from "./room.state.js";
import {
  getRoomByCode,
  saveFinalScoresToRoom,
} from "../services/room.service.js";
import { calculateScore } from "../utils/scoring.util.js";

// ── Helpers ────────────────────────────────────────────────────

/** Strip the correctAnswer before sending to clients */
const sanitiseQuestion = (question) => ({
  questionText: question.questionText,
  options: question.options,
});

/** Public player shape sent over the wire */
const publicPlayer = (p) => ({
  userId: p.userId,
  name: p.name,
  score: p.score,
  isReady: p.isReady,
  isConnected: p.isConnected,
});

// ── Game flow ──────────────────────────────────────────────────

const sendQuestion = (io, roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const { questions, timePerQuestion } = state.quiz;
  const question = questions[state.currentQuestionIndex];

  io.to(roomCode).emit("question_update", {
    question: sanitiseQuestion(question),
    questionIndex: state.currentQuestionIndex,
    timeLimit: timePerQuestion,
  });

  // Server-side auto-advance timer
  state.questionTimeout = setTimeout(() => {
    advanceQuestion(io, roomCode);
  }, timePerQuestion * 1000);
};

const advanceQuestion = (io, roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  state.currentQuestionIndex += 1;

  if (state.currentQuestionIndex >= state.quiz.questions.length) {
    endGame(io, roomCode);
  } else {
    sendQuestion(io, roomCode);
  }
};

const endGame = async (io, roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const finalLeaderboard = getLeaderboard(roomCode);
  const winner = finalLeaderboard[0] ?? null;

  io.to(roomCode).emit("game_over", { finalLeaderboard, winner });

  // Persist final scores to MongoDB
  try {
    await saveFinalScoresToRoom(roomCode, getAllPlayers(roomCode));
  } catch (err) {
    console.error("[Socket] Failed to save final scores:", err.message);
  }

  deleteRoomState(roomCode);
};

// ── Check if all connected players have answered ───────────────

const checkAllAnswered = (io, roomCode, questionIndex) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const allPlayers = getAllPlayers(roomCode);
  const connectedPlayers = allPlayers.filter((p) => p.isConnected);

  const answeredCount = connectedPlayers.filter((p) =>
    p.answers.some((a) => a.questionIndex === questionIndex),
  ).length;

  if (answeredCount === connectedPlayers.length) {
    // Everyone answered — clear the timer and advance after short delay
    // so players can see their result feedback before next question
    if (state.questionTimeout) {
      clearTimeout(state.questionTimeout);
      state.questionTimeout = null;
    }

    setTimeout(() => {
      advanceQuestion(io, roomCode);
    }, 1500);
  }
};

// ── Main handler ───────────────────────────────────────────────

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // ── join_room ────────────────────────────────────────────
    socket.on("join_room", async ({ roomCode, userId, userName }) => {
      try {
        // Load room + quiz from DB
        const roomDoc = await getRoomByCode(roomCode);
        if (!roomDoc) {
          socket.emit("error", { message: "Room not found." });
          return;
        }

        const isHost = roomDoc.hostId._id.toString() === userId?.toString();

        // Initialise or retrieve in-memory state
        const state = createRoomState(
          roomCode,
          roomDoc.quizId, // populated quiz object
          roomDoc.hostId._id.toString(),
          isHost ? socket.id : undefined,
        );

        socket.join(roomCode);

        const player = upsertPlayer(roomCode, {
          userId,
          name: userName,
          socketId: socket.id,
        });

        // Tell everyone else a new player joined
        socket
          .to(roomCode)
          .emit("player_joined", { player: publicPlayer(player) });

        // Send current room state to the joining player
        socket.emit("room_joined", {
          room: { roomCode, status: state.status, hostId: state.hostId },
          players: getAllPlayers(roomCode).map(publicPlayer),
        });
      } catch (err) {
        console.error("[Socket] join_room error:", err.message);
        socket.emit("error", {
          message: err.message || "Failed to join room.",
        });
      }
    });

    // ── player_ready ─────────────────────────────────────────
    socket.on("player_ready", ({ roomCode, userId, isReady }) => {
      const player = setPlayerReady(roomCode, userId, isReady);
      if (!player) return;
      io.to(roomCode).emit("player_ready", { userId, isReady });
    });

    // ── start_game ───────────────────────────────────────────
    socket.on("start_game", ({ roomCode }) => {
      const state = getRoomState(roomCode);
      if (!state) {
        socket.emit("error", { message: "Room not found." });
        return;
      }

      // Only host can start
      if (state.hostSocketId !== socket.id) {
        socket.emit("error", { message: "Only the host can start the game." });
        return;
      }

      state.status = "active";
      state.currentQuestionIndex = 0;

      io.to(roomCode).emit("game_started", {
        firstQuestion: sanitiseQuestion(state.quiz.questions[0]),
        totalQuestions: state.quiz.questions.length,
        timePerQuestion: state.quiz.timePerQuestion,
      });

      // Start the first question timer
      state.questionTimeout = setTimeout(() => {
        advanceQuestion(io, roomCode);
      }, state.quiz.timePerQuestion * 1000);
    });

    // ── submit_answer ────────────────────────────────────────
    socket.on(
      "submit_answer",
      ({ roomCode, userId, questionIndex, selectedAnswer, timeTaken }) => {
        const state = getRoomState(roomCode);
        if (!state || state.status !== "active") return;

        // Ignore answers for a stale question index
        if (state.currentQuestionIndex !== questionIndex) return;

        const question = state.quiz.questions[questionIndex];
        const isCorrect = question.correctAnswer === selectedAnswer;
        const points = calculateScore(timeTaken, isCorrect);

        const player = recordAnswer(
          roomCode,
          userId,
          {
            questionIndex,
            selectedAnswer,
            isCorrect,
            timeTaken,
          },
          points,
        );

        if (!player) return;

        // Send result back to the answering player only
        socket.emit("answer_result", {
          isCorrect,
          correctAnswer: question.correctAnswer,
          pointsEarned: points,
          currentScore: player.score,
        });

        // Broadcast updated leaderboard to everyone in room
        io.to(roomCode).emit("leaderboard_update", {
          leaderboard: getLeaderboard(roomCode),
        });

        // Auto-advance if all connected players have answered
        checkAllAnswered(io, roomCode, questionIndex);
      },
    );

    // ── leave_room ───────────────────────────────────────────
    socket.on("leave_room", ({ roomCode, userId }) => {
      removePlayer(roomCode, userId);
      socket.leave(roomCode);
      io.to(roomCode).emit("player_left", { userId });
    });

    // ── disconnect ───────────────────────────────────────────
    socket.on("disconnect", () => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { roomCode, player } = found;
      const state = getRoomState(roomCode);
      if (!state) return;

      // Mark disconnected
      player.isConnected = false;
      io.to(roomCode).emit("player_left", { userId: player.userId });

      const isHost = state.hostSocketId === socket.id;

      if (isHost) {
        if (state.status === "waiting") {
          // Room not started yet — close it
          io.to(roomCode).emit("error", {
            message: "Host disconnected. Room has been closed.",
          });
          deleteRoomState(roomCode);
          return;
        }

        // Game active — promote next connected player as host
        const nextHost = Array.from(state.players.values()).find(
          (p) => p.isConnected,
        );
        if (nextHost) {
          state.hostId = nextHost.userId.toString();
          state.hostSocketId = nextHost.socketId;
          io.to(roomCode).emit("host_changed", { newHostId: nextHost.userId });
        }
      }

      // If nobody is left, clean up
      const anyoneConnected = Array.from(state.players.values()).some(
        (p) => p.isConnected,
      );
      if (!anyoneConnected) {
        deleteRoomState(roomCode);
      }
    });
  });
};
