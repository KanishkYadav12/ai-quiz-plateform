import { createSlice } from '@reduxjs/toolkit'

const op = () => ({ status: 'idle', data: null, error: null })

const initialState = {
  coins: op(),
  ratio: op(),
  profile: op(),
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    coinsRequest: (state) => { state.coins = { status: 'pending', data: null, error: null } },
    coinsSuccess: (state, { payload }) => { state.coins = { status: 'success', data: payload, error: null } },
    coinsFailure: (state, { payload }) => { state.coins = { status: 'failed',  data: null,    error: payload } },

    ratioRequest: (state) => { state.ratio = { status: 'pending', data: null, error: null } },
    ratioSuccess: (state, { payload }) => { state.ratio = { status: 'success', data: payload, error: null } },
    ratioFailure: (state, { payload }) => { state.ratio = { status: 'failed',  data: null,    error: payload } },

    profileRequest: (state) => { state.profile = { status: 'pending', data: null, error: null } },
    profileSuccess: (state, { payload }) => { state.profile = { status: 'success', data: payload, error: null } },
    profileFailure: (state, { payload }) => { state.profile = { status: 'failed',  data: null,    error: payload } },
    clearProfile: (state) => { state.profile = op() }
  }
})

export const userActions = userSlice.actions
export const userReducer = userSlice.reducer

export const selectCoinsLeaderboard = (s) => s.user.coins
export const selectRatioLeaderboard = (s) => s.user.ratio
export const selectUserProfile      = (s) => s.user.profile
