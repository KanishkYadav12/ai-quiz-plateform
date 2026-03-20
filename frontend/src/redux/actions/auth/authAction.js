import { authActions } from '@/redux/slices/auth/authSlice'
import { authService } from '@/services/auth'

export const registerUser = (payload) => async (dispatch) => {
  dispatch(authActions.registerRequest())
  try {
    const data = await authService.register(payload)
    const { user, token } = data.data
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    dispatch(authActions.registerSuccess({ user, token }))
  } catch (err) {
    dispatch(authActions.registerFailure(
      err.response?.data?.message || 'Registration failed'
    ))
  }
}

export const loginUser = (payload) => async (dispatch) => {
  dispatch(authActions.loginRequest())
  try {
    const data = await authService.login(payload)
    const { user, token } = data.data
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    dispatch(authActions.loginSuccess({ user, token }))
  } catch (err) {
    dispatch(authActions.loginFailure(
      err.response?.data?.message || 'Login failed'
    ))
  }
}

export const logoutUser = () => (dispatch) => {
  dispatch(authActions.logout())
}
