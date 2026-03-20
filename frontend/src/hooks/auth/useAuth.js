'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { registerUser, loginUser, logoutUser } from '@/redux/actions/auth/authAction'
import {
  selectLoginOp,
  selectRegisterOp,
  selectIsAuthenticated,
  selectCurrentUser,
  authActions,
} from '@/redux/slices/auth/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const router   = useRouter()

  const loginOp    = useSelector(selectLoginOp)
  const registerOp = useSelector(selectRegisterOp)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user       = useSelector(selectCurrentUser)

  const [loginLoading,    setLoginLoading]    = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)

  // ── login effect ──────────────────────────────────────────
  useEffect(() => {
    if (loginOp.status === 'pending') {
      setLoginLoading(true)
    }
    if (loginOp.status === 'success') {
      setLoginLoading(false)
      toast.success('Welcome back!')
      dispatch(authActions.clearLoginError())
      router.push('/dashboard')
    }
    if (loginOp.status === 'failed') {
      setLoginLoading(false)
      toast.error(loginOp.error || 'Login failed')
      dispatch(authActions.clearLoginError())
    }
  }, [loginOp.status])

  // ── register effect ───────────────────────────────────────
  useEffect(() => {
    if (registerOp.status === 'pending') {
      setRegisterLoading(true)
    }
    if (registerOp.status === 'success') {
      setRegisterLoading(false)
      toast.success('Account created! Welcome!')
      dispatch(authActions.clearRegisterError())
      router.push('/dashboard')
    }
    if (registerOp.status === 'failed') {
      setRegisterLoading(false)
      toast.error(registerOp.error || 'Registration failed')
      dispatch(authActions.clearRegisterError())
    }
  }, [registerOp.status])

  const login    = (payload) => dispatch(loginUser(payload))
  const register = (payload) => dispatch(registerUser(payload))
  const logout   = () => {
    dispatch(logoutUser())
    router.push('/signin')
  }

  return {
    user,
    isAuthenticated,
    loginLoading,
    registerLoading,
    login,
    register,
    logout,
  }
}
