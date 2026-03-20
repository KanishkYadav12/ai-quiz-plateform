import { createSlice } from "@reduxjs/toolkit";

const op = () => ({ status: "idle", data: null, error: null });

const initialState = {
  create: op(),
  details: op(),
  myRooms: op(),
  history: op(),
  liveRooms: op(),
  game: {
    roomCode: null,
    status: "idle",
    players: [],
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    timePerQuestion: 30,
    leaderboard: [],
    answerResult: null,
    finalResult: null,
  },
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    // ── create ────────────────────────────────────────────
    createRequest: (state) => {
      state.create = { status: "pending", data: null, error: null };
    },
    createSuccess: (state, { payload }) => {
      state.create = { status: "success", data: payload, error: null };
    },
    createFailure: (state, { payload }) => {
      state.create = { status: "failed", data: null, error: payload };
    },
    clearCreate: (state) => {
      state.create = { status: "idle", data: null, error: null };
    },

    // ── details ───────────────────────────────────────────
    detailsRequest: (state) => {
      state.details = { status: "pending", data: null, error: null };
    },
    detailsSuccess: (state, { payload }) => {
      state.details = { status: "success", data: payload, error: null };
    },
    detailsFailure: (state, { payload }) => {
      state.details = { status: "failed", data: null, error: payload };
    },

    // ── my rooms ──────────────────────────────────────────
    myRoomsRequest: (state) => {
      state.myRooms = { status: "pending", data: null, error: null };
    },
    myRoomsSuccess: (state, { payload }) => {
      state.myRooms = { status: "success", data: payload, error: null };
    },
    myRoomsFailure: (state, { payload }) => {
      state.myRooms = { status: "failed", data: null, error: payload };
    },

    // ── history ───────────────────────────────────────────
    historyRequest: (state) => {
      state.history = { status: "pending", data: null, error: null };
    },
    historySuccess: (state, { payload }) => {
      state.history = { status: "success", data: payload, error: null };
    },
    historyFailure: (state, { payload }) => {
      state.history = { status: "failed", data: null, error: payload };
    },

    // ── live rooms ────────────────────────────────────────
    liveRoomsRequest: (state) => {
      state.liveRooms = { status: "pending", data: null, error: null };
    },
    liveRoomsSuccess: (state, { payload }) => {
      state.liveRooms = { status: "success", data: payload, error: null };
    },
    liveRoomsFailure: (state, { payload }) => {
      state.liveRooms = { status: "failed", data: null, error: payload };
    },
    updateLiveRoom: (state, { payload }) => {
      if (!state.liveRooms.data) return;

      if (payload.status === "deleted" || payload.status === "completed") {
        state.liveRooms.data = state.liveRooms.data.filter(
          (r) => r.roomCode !== payload.roomCode,
        );
      } else {
        const index = state.liveRooms.data.findIndex(
          (r) => r.roomCode === payload.roomCode,
        );
        if (index !== -1) {
          state.liveRooms.data[index] = {
            ...state.liveRooms.data[index],
            ...payload,
          };
        } else if (payload.status) {
          // It's a new room being created
          state.liveRooms.data.unshift(payload);
        }
      }
    },

    // ── live game state (socket-driven) ───────────────────
    setRoomJoined: (state, { payload }) => {
      state.game.roomCode = payload.room.roomCode;
      state.game.status = payload.room.status;
      state.game.players = payload.players;
      state.game.hostId = payload.room.hostId;
      state.game.quizId = payload.room.quizId;

      if (payload.room.status === "active") {
        state.game.currentQuestion = payload.currentQuestion;
        state.game.questionIndex = payload.room.currentQuestionIndex;
        state.game.totalQuestions = payload.room.totalQuestions;
        state.game.timePerQuestion = payload.room.timePerQuestion;
      }
    },
    playerJoined: (state, { payload }) => {
      const exists = state.game.players.find(
        (p) => p.userId === payload.player.userId,
      );
      if (!exists) state.game.players.push(payload.player);
    },
    playerLeft: (state, { payload }) => {
      state.game.players = state.game.players.filter(
        (p) => p.userId !== payload.userId,
      );
    },
    playerReadyUpdated: (state, { payload }) => {
      const p = state.game.players.find((p) => p.userId === payload.userId);
      if (p) p.isReady = payload.isReady;
    },
    gameStarted: (state, { payload }) => {
      state.game.status = "active";
      state.game.currentQuestion = payload.firstQuestion;
      state.game.questionIndex = 0;
      state.game.totalQuestions = payload.totalQuestions;
      state.game.timePerQuestion = payload.timePerQuestion;
      state.game.answerResult = null;
    },
    questionUpdated: (state, { payload }) => {
      state.game.currentQuestion = payload.question;
      state.game.questionIndex = payload.questionIndex;
      state.game.answerResult = null;
    },
    answerResultReceived: (state, { payload }) => {
      state.game.answerResult = payload;
    },
    leaderboardUpdated: (state, { payload }) => {
      state.game.leaderboard = payload.leaderboard;
    },
    gameOver: (state, { payload }) => {
      state.game.status = "completed";
      state.game.finalResult = payload;
      state.game.leaderboard = payload.finalLeaderboard;
    },
    playerDisqualified: (state, { payload }) => {
      const p = state.game.players.find((p) => p.userId === payload.userId);
      if (p) {
        p.isDisqualified = true;
        p.disqualifyReason = payload.reason;
        p.score = 0;
      }
      // Update leaderboard if player is there
      const lp = state.game.leaderboard.find((p) => p.userId === payload.userId);
      if (lp) lp.score = 0;
    },
    resetGame: (state) => {
      state.game = initialState.game;
    },
  },
});

export const roomActions = roomSlice.actions;
export const roomReducer = roomSlice.reducer;

// Selectors
export const selectRoomCreate = (s) => s.room.create;
export const selectRoomDetails = (s) => s.room.details;
export const selectMyRooms = (s) => s.room.myRooms;
export const selectRoomHistory = (s) => s.room.history;
export const selectLiveRooms = (s) => s.room.liveRooms;
export const selectGame = (s) => s.room.game;
