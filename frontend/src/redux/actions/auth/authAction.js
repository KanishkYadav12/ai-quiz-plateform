import { authActions } from "@/redux/slices/auth/authSlice";
import { authService } from "@/services/auth";

const setTokenCookie = (token) => {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const clearTokenCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
};

export const registerUser = (payload) => async (dispatch) => {
  dispatch(authActions.registerRequest());
  try {
    const data = await authService.register(payload);
    const { user, token } = data.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setTokenCookie(token);
    }
    dispatch(authActions.registerSuccess({ user, token }));
  } catch (err) {
    dispatch(
      authActions.registerFailure(
        err.response?.data?.message || "Registration failed",
      ),
    );
  }
};

export const loginUser = (payload) => async (dispatch) => {
  dispatch(authActions.loginRequest());
  try {
    const data = await authService.login(payload);
    const { user, token } = data.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setTokenCookie(token);
    }
    dispatch(authActions.loginSuccess({ user, token }));
  } catch (err) {
    dispatch(
      authActions.loginFailure(err.response?.data?.message || "Login failed"),
    );
  }
};

export const logoutUser = () => (dispatch) => {
  if (typeof window !== "undefined") {
    clearTokenCookie();
  }
  dispatch(authActions.logout());
};

export const refreshUserStats = (userId) => async (dispatch) => {
  dispatch(authActions.refreshUserRequest());
  try {
    const data = await authService.getMe();
    if (data.data.user) {
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }
      dispatch(authActions.refreshUserSuccess(data.data.user));
    }
  } catch (err) {
    dispatch(authActions.refreshUserFailure());
  }
};
