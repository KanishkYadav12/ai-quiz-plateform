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
 *   currentQuestionIndex: number
 *   questionTimeout:      Timeout | null   (server-side timer reference)
 *   players:              Map<userId, PlayerState>
 * }
 *
 * PlayerState:
 * {
 *   userId, name, socketId,
 *   score, answers[], isReady, isConnected
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
    currentQuestionIndex: 0,
    questionTimeout: null,
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
  if (state.questionTimeout) clearTimeout(state.questionTimeout);
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
    state.players.set(key, { ...existing, ...playerData, isConnected: true });
  } else {
    state.players.set(key, {
      score: 0,
      answers: [],
      isReady: false,
      isConnected: true,
      isDisqualified: false,
      disqualifyReason: null,
      ...playerData,
    });
  }

  return state.players.get(key);
};

export const removePlayer = (roomCode, userId) => {
  const state = getRoomState(roomCode);
  if (!state) return null;
  state.players.delete(userId.toString());
  return state;
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
  const alreadyAnswered = player.answers.some(
    (a) => a.questionIndex === answerData.questionIndex,
  );
  if (alreadyAnswered) return player;

  player.score += points;
  player.answers.push({ ...answerData, pointsEarned: points });

  return player;
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
