import { createSlice } from '@reduxjs/toolkit'

const op = () => ({ status: 'idle', data: null, error: null })

const initialState = {
  user:            null,
  token:           null,
  isAuthenticated: false,
  login:    op(),
  register: op(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ── register ──────────────────────────────────────────
    registerRequest: (state) => {
      state.register = { status: 'pending', data: null, error: null }
    },
    registerSuccess: (state, { payload }) => {
      state.register  = { status: 'success', data: payload, error: null }
      state.user      = payload.user
      state.token     = payload.token
      state.isAuthenticated = true
    },
    registerFailure: (state, { payload }) => {
      state.register = { status: 'failed', data: null, error: payload }
    },
    clearRegisterError: (state) => {
      state.register.error  = null
      state.register.status = 'idle'
    },

    // ── login ─────────────────────────────────────────────
    loginRequest: (state) => {
      state.login = { status: 'pending', data: null, error: null }
    },
    loginSuccess: (state, { payload }) => {
      state.login = { status: 'success', data: payload, error: null }
      state.user  = payload.user
      state.token = payload.token
      state.isAuthenticated = true
    },
    loginFailure: (state, { payload }) => {
      state.login = { status: 'failed', data: null, error: payload }
    },
    clearLoginError: (state) => {
      state.login.error  = null
      state.login.status = 'idle'
    },

    // ── session ───────────────────────────────────────────
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.login = op();
      state.register = op();
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
    setCredentials: (state, { payload }) => {
      state.user            = payload.user
      state.token           = payload.token
      state.isAuthenticated = true
    },
  },
})

export const authActions  = authSlice.actions
export const authReducer  = authSlice.reducer

// Selectors
export const selectAuth            = (s) => s.auth
export const selectCurrentUser     = (s) => s.auth.user
export const selectToken           = (s) => s.auth.token
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated
export const selectLoginOp         = (s) => s.auth.login
export const selectRegisterOp      = (s) => s.auth.register
