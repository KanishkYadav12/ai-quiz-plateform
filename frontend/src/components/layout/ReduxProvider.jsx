'use client'
import { useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { store } from '@/redux/store/store'
import { authActions } from '@/redux/slices/auth/authSlice'

function AuthInitializer({ children }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (token && user) {
      try {
        dispatch(
          authActions.setCredentials({
            token,
            user: JSON.parse(user),
          }),
        )
      } catch (err) {
        console.error('Failed to parse user from localStorage', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  return children
}

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  )
}
