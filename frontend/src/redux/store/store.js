import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from '@/redux/slices/auth/authSlice'
import { quizReducer } from '@/redux/slices/quiz/quizSlice'
import { roomReducer } from '@/redux/slices/room/roomSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quiz: quizReducer,
    room: roomReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})
