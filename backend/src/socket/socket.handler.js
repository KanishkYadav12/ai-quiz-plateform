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
  setPlayerQuestionTimer,
  clearPlayerQuestionTimer,
  clearAllPlayerQuestionTimers,
  markPlayerQuestionStarted,
  hasPlayerAnsweredQuestion,
  setPlayerCurrentQuestionIndex,
  markPlayerFinished,
  areAllPlayersFinished,
  markGameOverSent,
  setPlayerDisconnectTimeout,
  clearPlayerDisconnectTimeout,
} from "./room.state.js";
import {
  getRoomByCode,
  saveFinalScoresToRoom,
  updateRoomStatus,
} from "../services/room.service.js";
import { processGameRewards } from "../services/coin.service.js";
import { Quiz } from "../models/quiz.model.js";
import { calculateScore } from "../utils/scoring.util.js";

const QUESTION_FEEDBACK_DELAY_MS = 0;
const DISCONNECT_GRACE_MS = 12000;

const sanitiseQuestion = (question) => ({
  questionText: question.questionText,
  options: question.options,
});

const publicPlayer = (p) => ({
  userId: p.userId,
  name: p.name,
  score: p.score,
  isReady: p.isReady,
  isConnected: p.isConnected,
  isDisqualified: p.isDisqualified,
  disqualifyReason: p.disqualifyReason,
  currentQuestionIndex: p.currentQuestionIndex,
  finished: p.finished,
  finishedAt: p.finishedAt,
});

const emitLeaderboard = (io, roomCode) => {
  io.to(roomCode).emit("leaderboard_update", {
    leaderboard: getLeaderboard(roomCode),
  });
};

const findPlayerById = (state, userId) =>
  state.players.get(userId?.toString()) ?? null;

const emitQuestionToPlayer = (io, roomCode, userId) => {
  const state = getRoomState(roomCode);
  if (!state || state.status !== "active") return;

  const player = findPlayerById(state, userId);
  if (!player || player.finished || player.isDisqualified) return;

  const idx = player.currentQuestionIndex;
  const question = state.quiz.questions[idx];
  if (!question) return;

  markPlayerQuestionStarted(roomCode, userId, Date.now());

  if (player.socketId) {
    io.to(player.socketId).emit("question_update", {
      question: sanitiseQuestion(question),
      questionIndex: idx,
      timeLimit: state.quiz.timePerQuestion,
    });
  }

  clearPlayerQuestionTimer(roomCode, userId, idx);
  const timer = setTimeout(() => {
    handleQuestionTimeout(io, roomCode, userId, idx);
  }, state.quiz.timePerQuestion * 1000);

  setPlayerQuestionTimer(roomCode, userId, idx, timer);
};

const maybeEndGame = async (io, roomCode) => {
  if (!areAllPlayersFinished(roomCode)) return;
  await endGame(io, roomCode);
};

const notifyPlayerFinished = (io, roomCode, player) => {
  const payload = {
    userId: player.userId,
    name: player.name,
    score: player.isDisqualified ? 0 : player.score,
    finishedAt: player.finishedAt,
  };

  if (player.socketId) {
    io.to(player.socketId).emit("player_finished", payload);
  }
  io.to(roomCode).emit("player_finished", payload);
};

const advancePlayer = async (
  io,
  roomCode,
  userId,
  delayMs = QUESTION_FEEDBACK_DELAY_MS,
) => {
  const state = getRoomState(roomCode);
  if (!state || state.status !== "active") return;

  const player = findPlayerById(state, userId);
  if (!player || player.finished) return;

  const next = player.currentQuestionIndex + 1;
  if (next >= state.quiz.questions.length) {
    clearAllPlayerQuestionTimers(roomCode, userId);
    markPlayerFinished(roomCode, userId, Date.now());
    notifyPlayerFinished(io, roomCode, player);
    await maybeEndGame(io, roomCode);
    return;
  }

  setPlayerCurrentQuestionIndex(roomCode, userId, next);
  setTimeout(() => emitQuestionToPlayer(io, roomCode, userId), delayMs);
};

const handleQuestionTimeout = async (
  io,
  roomCode,
  userId,
  expectedQuestionIndex,
) => {
  const state = getRoomState(roomCode);
  if (!state || state.status !== "active") return;

  const player = findPlayerById(state, userId);
  if (!player || player.finished || player.isDisqualified) return;

  if (player.currentQuestionIndex !== expectedQuestionIndex) return;
  if (hasPlayerAnsweredQuestion(roomCode, userId, expectedQuestionIndex))
    return;

  const question = state.quiz.questions[expectedQuestionIndex];
  if (!question) return;

  clearPlayerQuestionTimer(roomCode, userId, expectedQuestionIndex);

  const timedOutSeconds = state.quiz.timePerQuestion;
  const updatedPlayer = recordAnswer(
    roomCode,
    userId,
    {
      questionIndex: expectedQuestionIndex,
      selectedAnswer: null,
      isCorrect: false,
      timeTaken: timedOutSeconds,
      autoSubmitted: true,
      timedOut: true,
    },
    0,
  );

  if (!updatedPlayer) return;

  if (player.socketId) {
    io.to(player.socketId).emit("answer_result", {
      isCorrect: false,
      correctAnswer: question.correctAnswer,
      pointsEarned: 0,
      currentScore: updatedPlayer.score,
      questionIndex: expectedQuestionIndex,
      timedOut: true,
    });
  }

  emitLeaderboard(io, roomCode);
  await advancePlayer(io, roomCode, userId, 0);
};

const disqualifyPlayer = async (io, roomCode, userId, reason) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const player = findPlayerById(state, userId);
  if (!player || player.isDisqualified) return;

  player.isDisqualified = true;
  player.disqualifyReason = reason;
  player.score = 0;

  clearAllPlayerQuestionTimers(roomCode, userId);

  if (!player.finished) {
    markPlayerFinished(roomCode, userId, Date.now());
  }

  io.to(roomCode).emit("player_disqualified", {
    userId,
    name: player.name,
    reason,
  });

  notifyPlayerFinished(io, roomCode, player);
  emitLeaderboard(io, roomCode);
  await maybeEndGame(io, roomCode);
};

const buildQuizAnalytics = (state, players) => {
  const totalQuestions = state.quiz.questions.length;
  const questionStats = state.quiz.questions.map((_q, questionIndex) => {
    const answers = players
      .map((p) => p.answers.find((a) => a.questionIndex === questionIndex))
      .filter(Boolean);

    const totalAnswered = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const correctRate =
      totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    const times = answers.map((a) => a.timeTaken);
    const fastestTime = times.length > 0 ? Math.min(...times) : null;
    const averageTime =
      times.length > 0
        ? Number((times.reduce((s, t) => s + t, 0) / times.length).toFixed(2))
        : null;

    return {
      questionIndex,
      correctCount,
      totalAnswered,
      correctRate,
      fastestTime,
      averageTime,
    };
  });

  return {
    totalQuestions,
    questionStats,
  };
};

const calculateLongestStreak = (answers) => {
  let current = 0;
  let best = 0;
  for (const a of answers) {
    if (a.isCorrect) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
};

const buildPlayerStats = (state, players, rewards) => {
  const stats = {};

  for (const p of players) {
    const userId = p.userId.toString();
    const answers = [...p.answers].sort(
      (a, b) => a.questionIndex - b.questionIndex,
    );
    const correct = answers.filter((a) => a.isCorrect).length;
    const wrong = answers.length - correct;
    const times = answers.map((a) => a.timeTaken);

    const avgTime = times.length
      ? Number((times.reduce((s, t) => s + t, 0) / times.length).toFixed(2))
      : 0;
    const fastestTime = times.length ? Math.min(...times) : 0;
    const slowestTime = times.length ? Math.max(...times) : 0;
    const longestStreak = calculateLongestStreak(answers);

    const detailedAnswers = answers.map((a) => {
      const question = state.quiz.questions[a.questionIndex];
      return {
        questionIndex: a.questionIndex,
        questionText: question?.questionText ?? "",
        selectedAnswer: a.selectedAnswer,
        correctAnswer: question?.correctAnswer,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        timeTaken: a.timeTaken,
      };
    });

    const reward = rewards[userId] || {
      total: 0,
      placement: 0,
      bonuses: [],
      newBadges: [],
    };

    stats[userId] = {
      score: p.isDisqualified ? 0 : p.score,
      correct,
      wrong,
      avgTime,
      fastestTime,
      slowestTime,
      longestStreak,
      answers: detailedAnswers,
      coinsEarned: reward.total || 0,
      bonusBreakdown: {
        placement: reward.placement || 0,
        bonuses: reward.bonuses || [],
      },
      badgesEarned: reward.newBadges || [],
      finished: p.finished,
      finishedAt: p.finishedAt,
      isDisqualified: p.isDisqualified,
      disqualifyReason: p.disqualifyReason,
    };
  }

  return stats;
};

const endGame = async (io, roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return;

  const firstFinishGuard = markGameOverSent(roomCode);
  if (!firstFinishGuard) return;

  const players = getAllPlayers(roomCode);
  const finalLeaderboard = getLeaderboard(roomCode);
  const winner = finalLeaderboard[0] ?? null;

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

  const quizAnalytics = buildQuizAnalytics(state, players);
  const playerStats = buildPlayerStats(state, players, rewards);
  const coinsAwarded = Object.fromEntries(
    Object.entries(rewards).map(([userId, reward]) => [
      userId,
      reward.total || 0,
    ]),
  );

  const finalPayload = {
    finalLeaderboard,
    winner,
    rewards,
    quizId: state.quiz._id,
    quizAnalytics,
    playerStats,
    coinsAwarded,
    allPlayersFinished: true,
  };

  io.to(roomCode).emit("game_over", finalPayload);

  try {
    await saveFinalScoresToRoom(roomCode, players, finalPayload);

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
    console.error(
      "[Socket] Failed to save final scores / update analytics:",
      err.message,
    );

    // Ensure room does not remain in live list if persistence partially fails.
    try {
      await updateRoomStatus(roomCode, "completed");
    } catch {
      // no-op fallback
    }
  }

  deleteRoomState(roomCode);
  io.emit("room_status_update", { roomCode, status: "completed" });
};

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_dashboard", () => {
      socket.join("dashboard");
    });

    socket.on("join_room", async ({ roomCode, userId, userName }) => {
      try {
        const roomDoc = await getRoomByCode(roomCode);
        if (!roomDoc) {
          socket.emit("error", { message: "Room not found." });
          return;
        }

        const isHost = roomDoc.hostId._id.toString() === userId?.toString();

        const state = createRoomState(
          roomCode,
          roomDoc.quizId,
          roomDoc.hostId._id.toString(),
          isHost ? socket.id : undefined,
        );

        socket.join(roomCode);

        const player = upsertPlayer(roomCode, {
          userId,
          name: userName,
          socketId: socket.id,
        });
        clearPlayerDisconnectTimeout(roomCode, userId);

        socket
          .to(roomCode)
          .emit("player_joined", { player: publicPlayer(player) });

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

        const currentQuestion =
          state.status === "active" && !player.finished
            ? sanitiseQuestion(
                state.quiz.questions[player.currentQuestionIndex],
              )
            : null;

        socket.emit("room_joined", {
          room: {
            roomCode,
            status: state.status,
            hostId: state.hostId,
            quizId: state.quiz._id,
            currentQuestionIndex: player.currentQuestionIndex,
            totalQuestions: state.quiz.questions.length,
            timePerQuestion: state.quiz.timePerQuestion,
          },
          players: getAllPlayers(roomCode).map(publicPlayer),
          leaderboard: getLeaderboard(roomCode),
          currentQuestion,
          playerProgress: {
            currentQuestionIndex: player.currentQuestionIndex,
            finished: player.finished,
            finishedAt: player.finishedAt,
          },
        });

        if (
          state.status === "active" &&
          !player.finished &&
          !player.isDisqualified
        ) {
          emitQuestionToPlayer(io, roomCode, userId);
        }
      } catch (err) {
        console.error("[Socket] join_room error:", err.message);
        socket.emit("error", {
          message: err.message || "Failed to join room.",
        });
      }
    });

    socket.on("player_ready", ({ roomCode, userId, isReady }) => {
      const player = setPlayerReady(roomCode, userId, isReady);
      if (!player) return;
      io.to(roomCode).emit("player_ready", { userId, isReady });
    });

    socket.on("start_game", ({ roomCode }) => {
      const state = getRoomState(roomCode);
      if (!state) {
        socket.emit("error", { message: "Room not found." });
        return;
      }

      if (state.hostSocketId !== socket.id) {
        socket.emit("error", { message: "Only the host can start the game." });
        return;
      }

      // Remove stale offline players before game starts so they cannot block
      // all-finished detection later.
      for (const p of Array.from(state.players.values())) {
        if (!p.isConnected) {
          removePlayer(roomCode, p.userId);
        }
      }

      state.status = "active";

      for (const player of state.players.values()) {
        player.currentQuestionIndex = 0;
        player.questionTimers = {};
        player.answeredQuestions = new Set();
        player.finished = false;
        player.finishedAt = null;
        player.lastQuestionStartedAt = null;
      }

      io.to("dashboard").emit("room_status_update", {
        roomCode,
        status: "active",
      });

      io.to(roomCode).emit("game_started", {
        totalQuestions: state.quiz.questions.length,
        timePerQuestion: state.quiz.timePerQuestion,
      });

      for (const player of state.players.values()) {
        if (!player.isConnected || player.isDisqualified) continue;
        emitQuestionToPlayer(io, roomCode, player.userId);
      }
    });

    socket.on(
      "submit_answer",
      async ({
        roomCode,
        userId,
        questionIndex,
        selectedAnswer,
        timeTaken,
      }) => {
        const state = getRoomState(roomCode);
        if (!state || state.status !== "active") return;

        const player = findPlayerById(state, userId);
        if (!player || player.finished || player.isDisqualified) return;

        // Keep player socket binding fresh even if reconnect happened mid-round.
        if (player.socketId !== socket.id) {
          player.socketId = socket.id;
          player.isConnected = true;
          clearPlayerDisconnectTimeout(roomCode, userId);
        }

        const expectedQuestionIndex = player.currentQuestionIndex;
        if (expectedQuestionIndex !== questionIndex) return;
        if (hasPlayerAnsweredQuestion(roomCode, userId, questionIndex)) return;

        const question = state.quiz.questions[questionIndex];
        if (!question) return;

        clearPlayerQuestionTimer(roomCode, userId, questionIndex);

        const resolvedTimeTaken = Number.isFinite(timeTaken)
          ? Math.max(1, Math.min(timeTaken, state.quiz.timePerQuestion))
          : state.quiz.timePerQuestion;

        const isCorrect = question.correctAnswer === selectedAnswer;
        const points = calculateScore(resolvedTimeTaken, isCorrect);

        const updatedPlayer = recordAnswer(
          roomCode,
          userId,
          {
            questionIndex,
            selectedAnswer,
            isCorrect,
            timeTaken: resolvedTimeTaken,
          },
          points,
        );

        if (!updatedPlayer) return;

        socket.emit("answer_result", {
          isCorrect,
          correctAnswer: question.correctAnswer,
          pointsEarned: points,
          currentScore: updatedPlayer.score,
          questionIndex,
        });

        emitLeaderboard(io, roomCode);
        await advancePlayer(io, roomCode, userId, QUESTION_FEEDBACK_DELAY_MS);
      },
    );

    socket.on("disqualify_player", async ({ roomCode, userId, reason }) => {
      await disqualifyPlayer(io, roomCode, userId, reason);
    });

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

    socket.on("disconnect", async () => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { roomCode, player } = found;
      const state = getRoomState(roomCode);
      if (!state) return;

      player.isConnected = false;
      io.to(roomCode).emit("player_left", { userId: player.userId });

      io.to("dashboard").emit("room_status_update", {
        roomCode,
        playerCount: state.players.size,
      });

      const isHost = state.hostSocketId === socket.id;

      if (isHost) {
        if (state.status === "waiting") {
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

        const nextHost = Array.from(state.players.values()).find(
          (p) => p.isConnected,
        );
        if (nextHost) {
          state.hostId = nextHost.userId.toString();
          state.hostSocketId = nextHost.socketId;
          io.to(roomCode).emit("host_changed", { newHostId: nextHost.userId });
        }
      }

      // In lobby/waiting state, remove disconnected non-host players
      // immediately so they do not linger into the game start state.
      if (state.status === "waiting" && !isHost) {
        removePlayer(roomCode, player.userId);
        io.to("dashboard").emit("room_status_update", {
          roomCode,
          playerCount: state.players.size,
        });
      }

      if (state.status === "active" && !player.finished) {
        const disconnectTimer = setTimeout(async () => {
          const latestState = getRoomState(roomCode);
          if (!latestState || latestState.status !== "active") return;

          const latestPlayer = findPlayerById(latestState, player.userId);
          if (
            !latestPlayer ||
            latestPlayer.finished ||
            latestPlayer.isConnected
          ) {
            return;
          }

          clearAllPlayerQuestionTimers(roomCode, latestPlayer.userId);
          markPlayerFinished(roomCode, latestPlayer.userId, Date.now());
          notifyPlayerFinished(io, roomCode, latestPlayer);
          await maybeEndGame(io, roomCode);
        }, DISCONNECT_GRACE_MS);

        setPlayerDisconnectTimeout(roomCode, player.userId, disconnectTimer);
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
