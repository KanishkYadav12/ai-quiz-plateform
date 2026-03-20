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
import { processGameRewards } from "../services/coin.service.js";
import { Quiz } from "../models/quiz.model.js";
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
  isDisqualified: p.isDisqualified,
  disqualifyReason: p.disqualifyReason,
});

// ── Game flow ──────────────────────────────────────────────────

const sendQuestion = (io, roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const { questions, timePerQuestion } = state.quiz;
  const question = questions[state.currentQuestionIndex];

  if (!question) {
    return endGame(io, roomCode);
  }

  io.to(roomCode).emit("question_update", {
    question: sanitiseQuestion(question),
    questionIndex: state.currentQuestionIndex,
    timeLimit: timePerQuestion,
  });

  // Server-side auto-advance timer
  if (state.questionTimeout) clearTimeout(state.questionTimeout);
  state.questionTimeout = setTimeout(() => {
    advanceQuestion(io, roomCode, state.currentQuestionIndex);
  }, timePerQuestion * 1000);
};

const advanceQuestion = (io, roomCode, expectedIndex) => {
  const state = getRoomState(roomCode);
  if (!state || state.status !== "active") return;

  // Prevent duplicate advances for the same question
  if (
    expectedIndex !== undefined &&
    state.currentQuestionIndex !== expectedIndex
  ) {
    return;
  }

  // Clear any existing timer to prevent double-advancing
  if (state.questionTimeout) {
    clearTimeout(state.questionTimeout);
    state.questionTimeout = null;
  }

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

  const players = getAllPlayers(roomCode);
  const finalLeaderboard = getLeaderboard(roomCode);
  const winner = finalLeaderboard[0] ?? null;

  // Process Coins and Badges
  let rewards = {};
  try {
    rewards = await processGameRewards(
      roomCode,
      players,
      state.quiz.questions.length,
      state.quiz._id,
    );
  } catch (err) {
    console.error("[Socket] Failed to process rewards:", err.message);
  }

  io.to(roomCode).emit("game_over", {
    finalLeaderboard,
    winner,
    rewards,
    quizId: state.quiz._id,
  });

  // Persist final scores to MongoDB
  try {
    await saveFinalScoresToRoom(roomCode, players);

    // Update Quiz Analytics
    const quiz = await Quiz.findById(state.quiz._id);
    if (quiz) {
      quiz.timesPlayed += 1;
      quiz.totalParticipants += players.length;
      quiz.totalScoreSum += players.reduce((sum, p) => sum + p.score, 0);
      const topScore = finalLeaderboard[0]?.score || 0;
      if (topScore > quiz.highestScore) quiz.highestScore = topScore;
      await quiz.save();
    }
  } catch (err) {
    console.error("[Socket] Failed to save final scores / update analytics:", err.message);
  }

  deleteRoomState(roomCode);
  io.emit("room_status_update", { roomCode, status: "completed" });
};

// ── Disqualification ───────────────────────────────────────────

const disqualifyPlayer = (io, roomCode, userId, reason) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const player = state.players.get(userId.toString());
  if (!player || player.isDisqualified) return;

  player.isDisqualified = true;
  player.disqualifyReason = reason;
  player.score = 0;

  io.to(roomCode).emit("player_disqualified", {
    userId,
    name: player.name,
    reason,
  });

  io.to(roomCode).emit("leaderboard_update", {
    leaderboard: getLeaderboard(roomCode),
  });
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

  if (answeredCount === connectedPlayers.length && connectedPlayers.length > 0) {
    // Everyone answered — clear the timer and advance after short delay
    // so players can see their result feedback before next question
    if (state.questionTimeout) {
      clearTimeout(state.questionTimeout);
      state.questionTimeout = null;
    }

    setTimeout(() => {
      advanceQuestion(io, roomCode, questionIndex);
    }, 1500);
  }
};

// ── Main handler ───────────────────────────────────────────────

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // Join a global dashboard room to receive live room updates
    socket.on("join_dashboard", () => {
      socket.join("dashboard");
    });

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

        // If room is new or status updated, notify dashboard
        io.to("dashboard").emit("room_status_update", {
          roomCode,
          status: state.status,
          playerCount: state.players.size,
          hostName: roomDoc.hostId.name,
          quizTitle: state.quiz.title,
          topic: state.quiz.topic,
          difficulty: state.quiz.difficulty,
          createdAt: roomDoc.createdAt,
        });

        // Send current room state to the joining player
        socket.emit("room_joined", {
          room: {
            roomCode,
            status: state.status,
            hostId: state.hostId,
            quizId: state.quiz._id,
            currentQuestionIndex: state.currentQuestionIndex,
            totalQuestions: state.quiz.questions.length,
            timePerQuestion: state.quiz.timePerQuestion,
          },
          players: getAllPlayers(roomCode).map(publicPlayer),
          currentQuestion:
            state.status === "active"
              ? sanitiseQuestion(state.quiz.questions[state.currentQuestionIndex])
              : null,
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

      io.to("dashboard").emit("room_status_update", {
        roomCode,
        status: "active",
      });

      io.to(roomCode).emit("game_started", {
        firstQuestion: sanitiseQuestion(state.quiz.questions[0]),
        totalQuestions: state.quiz.questions.length,
        timePerQuestion: state.quiz.timePerQuestion,
      });

      // Start the first question timer
      state.questionTimeout = setTimeout(() => {
        advanceQuestion(io, roomCode, 0);
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

    // ── disqualify_player ────────────────────────────────────
    socket.on("disqualify_player", ({ roomCode, userId, reason }) => {
      disqualifyPlayer(io, roomCode, userId, reason);
    });

    // ── leave_room ───────────────────────────────────────────
    socket.on("leave_room", ({ roomCode, userId }) => {
      removePlayer(roomCode, userId);
      socket.leave(roomCode);
      io.to(roomCode).emit("player_left", { userId });

      const state = getRoomState(roomCode);
      if (state) {
        io.to("dashboard").emit("room_status_update", {
          roomCode,
          playerCount: state.players.size,
        });
      }
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

      io.to("dashboard").emit("room_status_update", {
        roomCode,
        playerCount: state.players.size,
      });

      const isHost = state.hostSocketId === socket.id;

      if (isHost) {
        if (state.status === "waiting") {
          // Room not started yet — close it
          io.to(roomCode).emit("error", {
            message: "Host disconnected. Room has been closed.",
          });
          deleteRoomState(roomCode);
          io.to("dashboard").emit("room_status_update", {
            roomCode,
            status: "deleted",
          });
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
      // If game is active, mark player as disqualified (Mid-game leave)
      if (state.status === "active" && !player.isDisqualified) {
        disqualifyPlayer(io, roomCode, player.userId, "Left during gameplay");
      }

      const anyoneConnected = Array.from(state.players.values()).some(
        (p) => p.isConnected,
      );
      if (!anyoneConnected) {
        deleteRoomState(roomCode);
        io.to("dashboard").emit("room_status_update", {
          roomCode,
          status: "deleted",
        });
      }
    });
  });
};
