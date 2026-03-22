/**
 * In-memory store for active game rooms.
 *
 * Each room entry:
 * {
 *   roomCode:             string
 *   quiz:                 { _id, questions[], timePerQuestion }
 *   hostId:               string (userId)
 *   hostSocketId:         string
 *   status:               'waiting' | 'active' | 'completed'
 *   players:              Map<userId, PlayerState>
 *   gameOverSent:         boolean
 * }
 *
 * PlayerState:
 * {
 *   userId, name, socketId,
 *   score, answers[], isReady, isConnected
 *   currentQuestionIndex, questionTimers,
 *   answeredQuestions, finished, finishedAt, lastQuestionStartedAt,
 *   disconnectTimeout
 * }
 *
 * NOTE: This state lives in RAM. On server restart it is lost.
 * Production upgrade: replace with Redis.
 */

const rooms = new Map();

// ── Room CRUD ─────────────────────────────────────────────────

export const createRoomState = (roomCode, quiz, hostId, hostSocketId) => {
  if (rooms.has(roomCode)) {
    // Room already initialised (e.g. host rejoined) — just update host socket
    const existing = rooms.get(roomCode);
    if (hostSocketId) existing.hostSocketId = hostSocketId;
    return existing;
  }

  const state = {
    roomCode,
    quiz,
    hostId,
    hostSocketId,
    status: "waiting",
    gameOverSent: false,
    players: new Map(),
  };

  rooms.set(roomCode, state);
  return state;
};

export const getRoomState = (roomCode) => rooms.get(roomCode) ?? null;
export const roomExists = (roomCode) => rooms.has(roomCode);

export const deleteRoomState = (roomCode) => {
  const state = rooms.get(roomCode);
  if (!state) return;
  for (const player of state.players.values()) {
    if (!player.questionTimers) continue;
    for (const timer of Object.values(player.questionTimers)) {
      clearTimeout(timer);
    }
    if (player.disconnectTimeout) {
      clearTimeout(player.disconnectTimeout);
    }
  }
  rooms.delete(roomCode);
};

// Find which room a socket belongs to (used on disconnect)
export const findRoomBySocketId = (socketId) => {
  for (const state of rooms.values()) {
    for (const player of state.players.values()) {
      if (player.socketId === socketId) {
        return { roomCode: state.roomCode, player };
      }
    }
  }
  return null;
};

// ── Player CRUD ───────────────────────────────────────────────

export const upsertPlayer = (roomCode, playerData) => {
  const state = getRoomState(roomCode);
  if (!state) return null;

  const key = playerData.userId.toString();
  const existing = state.players.get(key);

  if (existing) {
    if (existing.disconnectTimeout) {
      clearTimeout(existing.disconnectTimeout);
      existing.disconnectTimeout = null;
    }
    state.players.set(key, { ...existing, ...playerData, isConnected: true });
  } else {
    state.players.set(key, {
      score: 0,
      answers: [],
      isReady: false,
      isConnected: true,
      isDisqualified: false,
      disqualifyReason: null,
      currentQuestionIndex: 0,
      questionTimers: {},
      answeredQuestions: new Set(),
      finished: false,
      finishedAt: null,
      lastQuestionStartedAt: null,
      disconnectTimeout: null,
      ...playerData,
    });
  }

  return state.players.get(key);
};

export const removePlayer = (roomCode, userId) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const existing = state.players.get(userId.toString());
  if (existing?.questionTimers) {
    for (const timer of Object.values(existing.questionTimers)) {
      clearTimeout(timer);
    }
  }
  if (existing?.disconnectTimeout) {
    clearTimeout(existing.disconnectTimeout);
  }
  state.players.delete(userId.toString());
  return state;
};

export const setPlayerDisconnectTimeout = (roomCode, userId, timer) => {
  const state = getRoomState(roomCode);
  if (!state) return null;

  const player = state.players.get(userId.toString());
  if (!player) return null;

  if (player.disconnectTimeout) {
    clearTimeout(player.disconnectTimeout);
  }
  player.disconnectTimeout = timer;
  return player;
};

export const clearPlayerDisconnectTimeout = (roomCode, userId) => {
  const state = getRoomState(roomCode);
  if (!state) return null;

  const player = state.players.get(userId.toString());
  if (!player) return null;

  if (player.disconnectTimeout) {
    clearTimeout(player.disconnectTimeout);
    player.disconnectTimeout = null;
  }

  return player;
};

export const setPlayerReady = (roomCode, userId, isReady) => {
  const state = getRoomState(roomCode);
  if (!state) return null;

  const player = state.players.get(userId.toString());
  if (!player) return null;

  player.isReady = isReady;
  return player;
};

// ── Score + answers ───────────────────────────────────────────

export const recordAnswer = (roomCode, userId, answerData, points) => {
  const state = getRoomState(roomCode);
  if (!state) return null;

  const player = state.players.get(userId.toString());
  if (!player || player.isDisqualified) return null;

  // Prevent duplicate submission for the same question
  const alreadyAnswered = player.answeredQuestions?.has(
    answerData.questionIndex,
  );
  if (alreadyAnswered) return player;

  player.score += points;
  player.answers.push({ ...answerData, pointsEarned: points });
  player.answeredQuestions.add(answerData.questionIndex);

  return player;
};

// ── Per-player progression ────────────────────────────────────

export const setPlayerQuestionTimer = (
  roomCode,
  userId,
  questionIndex,
  timer,
) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;

  const existing = player.questionTimers?.[questionIndex];
  if (existing) clearTimeout(existing);
  player.questionTimers[questionIndex] = timer;
  return player;
};

export const clearPlayerQuestionTimer = (roomCode, userId, questionIndex) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;

  const timer = player.questionTimers?.[questionIndex];
  if (timer) {
    clearTimeout(timer);
    delete player.questionTimers[questionIndex];
  }

  return player;
};

export const clearAllPlayerQuestionTimers = (roomCode, userId) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;

  for (const timer of Object.values(player.questionTimers || {})) {
    clearTimeout(timer);
  }
  player.questionTimers = {};
  return player;
};

export const markPlayerQuestionStarted = (
  roomCode,
  userId,
  startedAt = Date.now(),
) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;
  player.lastQuestionStartedAt = startedAt;
  return player;
};

export const hasPlayerAnsweredQuestion = (roomCode, userId, questionIndex) => {
  const state = getRoomState(roomCode);
  if (!state) return false;
  const player = state.players.get(userId.toString());
  if (!player) return false;
  return player.answeredQuestions?.has(questionIndex) || false;
};

export const setPlayerCurrentQuestionIndex = (
  roomCode,
  userId,
  questionIndex,
) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;
  player.currentQuestionIndex = questionIndex;
  return player;
};

export const markPlayerFinished = (
  roomCode,
  userId,
  finishedAt = Date.now(),
) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  const player = state.players.get(userId.toString());
  if (!player) return null;

  player.finished = true;
  player.finishedAt = finishedAt;
  player.currentQuestionIndex = state.quiz.questions.length;
  return player;
};

export const areAllPlayersFinished = (roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return false;

  const players = Array.from(state.players.values());
  if (players.length === 0) return true;
  return players.every((p) => p.finished === true);
};

export const markGameOverSent = (roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return false;
  if (state.gameOverSent) return false;
  state.gameOverSent = true;
  return true;
};

// ── Leaderboard ───────────────────────────────────────────────

export const getLeaderboard = (roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return [];

  return Array.from(state.players.values())
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.isDisqualified ? 0 : p.score,
      isDisqualified: p.isDisqualified,
      averageTime:
        p.answers.length > 0
          ? p.answers.reduce((sum, a) => sum + a.timeTaken, 0) /
            p.answers.length
          : Infinity,
    }))
    .sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.averageTime - b.averageTime,
    );
};

export const getAllPlayers = (roomCode) => {
  const state = getRoomState(roomCode);
  if (!state) return [];
  return Array.from(state.players.values());
};
