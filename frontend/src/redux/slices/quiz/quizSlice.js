import { createSlice } from "@reduxjs/toolkit";

const op = () => ({ status: "idle", data: null, error: null });

const initialState = {
  list: op(),
  publicList: op(),
  details: op(),
  analytics: op(),
  create: op(),
  clone: op(),
  delete: op(),
  publish: op(),
  rate: op(),
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    // ── list ──────────────────────────────────────────────
    listRequest: (state) => {
      state.list = { status: "pending", data: null, error: null };
    },
    listSuccess: (state, { payload }) => {
      state.list = { status: "success", data: payload, error: null };
    },
    listFailure: (state, { payload }) => {
      state.list = { status: "failed", data: null, error: payload };
    },
    clearListError: (state) => {
      state.list.error = null;
      state.list.status = "idle";
    },

    // ── public list ───────────────────────────────────────
    publicListRequest: (state) => {
      state.publicList = { status: "pending", data: null, error: null };
    },
    publicListSuccess: (state, { payload }) => {
      state.publicList = { status: "success", data: payload, error: null };
    },
    publicListFailure: (state, { payload }) => {
      state.publicList = { status: "failed", data: null, error: payload };
    },
    clearPublicListError: (state) => {
      state.publicList.error = null;
      state.publicList.status = "idle";
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
    clearDetailsError: (state) => {
      state.details.error = null;
      state.details.status = "idle";
    },

    // ── analytics ─────────────────────────────────────────
    analyticsRequest: (state) => {
      state.analytics = { status: "pending", data: null, error: null };
    },
    analyticsSuccess: (state, { payload }) => {
      state.analytics = { status: "success", data: payload, error: null };
    },
    analyticsFailure: (state, { payload }) => {
      state.analytics = { status: "failed", data: null, error: payload };
    },
    clearAnalyticsError: (state) => {
      state.analytics.error = null;
      state.analytics.status = "idle";
    },

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

    // ── clone ─────────────────────────────────────────────
    cloneRequest: (state) => {
      state.clone = { status: "pending", data: null, error: null };
    },
    cloneSuccess: (state, { payload }) => {
      state.clone = { status: "success", data: payload, error: null };
    },
    cloneFailure: (state, { payload }) => {
      state.clone = { status: "failed", data: null, error: payload };
    },
    clearClone: (state) => {
      state.clone = { status: "idle", data: null, error: null };
    },

    // ── delete ────────────────────────────────────────────
    deleteRequest: (state) => {
      state.delete = { status: "pending", data: null, error: null };
    },
    deleteSuccess: (state, { payload }) => {
      state.delete = { status: "success", data: payload, error: null };
      // Remove from list if loaded
      if (state.list.data) {
        state.list.data = state.list.data.filter(
          (q) => q._id !== payload.quizId,
        );
      }
    },
    deleteFailure: (state, { payload }) => {
      state.delete = { status: "failed", data: null, error: payload };
    },
    clearDelete: (state) => {
      state.delete = { status: "idle", data: null, error: null };
    },

    // ── publish toggle ────────────────────────────────────
    publishRequest: (state) => {
      state.publish = { status: "pending", data: null, error: null };
    },
    publishSuccess: (state, { payload }) => {
      state.publish = { status: "success", data: payload, error: null };
      if (state.details.data?._id === payload._id) state.details.data = payload;
    },
    publishFailure: (state, { payload }) => {
      state.publish = { status: "failed", data: null, error: payload };
    },
    clearPublish: (state) => {
      state.publish = { status: "idle", data: null, error: null };
    },

    // ── rate ──────────────────────────────────────────────
    rateRequest: (state) => {
      state.rate = { status: "pending", data: null, error: null };
    },
    rateSuccess: (state, { payload }) => {
      state.rate = { status: "success", data: payload, error: null };
      if (state.details.data?._id === payload._id) state.details.data = payload;
      // Also update in public list if exists
      if (state.publicList.data) {
        const idx = state.publicList.data.findIndex(
          (q) => q._id === payload._id,
        );
        if (idx !== -1) state.publicList.data[idx] = payload;
      }
    },
    rateFailure: (state, { payload }) => {
      state.rate = { status: "failed", data: null, error: payload };
    },
    clearRate: (state) => {
      state.rate = { status: "idle", data: null, error: null };
    },
  },
});

export const quizActions = quizSlice.actions;
export const quizReducer = quizSlice.reducer;

// Selectors
export const selectQuizList = (s) => s.quiz.list;
export const selectPublicQuizList = (s) => s.quiz.publicList;
export const selectQuizDetails = (s) => s.quiz.details;
export const selectQuizAnalytics = (s) => s.quiz.analytics;
export const selectQuizCreate = (s) => s.quiz.create;
export const selectQuizClone = (s) => s.quiz.clone;
export const selectQuizDelete = (s) => s.quiz.delete;
export const selectQuizPublish = (s) => s.quiz.publish;
export const selectQuizRate = (s) => s.quiz.rate;
