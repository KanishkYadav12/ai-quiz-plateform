import { userActions } from '@/redux/slices/user/userSlice'
import { userService } from '@/services/user'

export const fetchCoinsLeaderboard = () => async (dispatch) => {
  dispatch(userActions.coinsRequest())
  try {
    const data = await userService.getCoinsLeaderboard()
    dispatch(userActions.coinsSuccess(data.data.users))
  } catch (err) {
    dispatch(userActions.coinsFailure(err.response?.data?.message || 'Failed to load leaderboard'))
  }
}

export const fetchRatioLeaderboard = () => async (dispatch) => {
  dispatch(userActions.ratioRequest())
  try {
    const data = await userService.getRatioLeaderboard()
    dispatch(userActions.ratioSuccess(data.data.users))
  } catch (err) {
    dispatch(userActions.ratioFailure(err.response?.data?.message || 'Failed to load leaderboard'))
  }
}

export const fetchUserProfile = (userId) => async (dispatch) => {
  dispatch(userActions.profileRequest())
  try {
    const data = await userService.getProfile(userId)
    dispatch(userActions.profileSuccess(data.data))
  } catch (err) {
    dispatch(userActions.profileFailure(err.response?.data?.message || 'Failed to load profile'))
  }
}
