'use client'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { selectIsAuthenticated } from '@/redux/slices/auth/authSlice'

export default function AuthGuard({ children }) {
  const router          = useRouter()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    // also check localStorage as a fallback (for hard refresh)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!isAuthenticated && !token) {
      router.replace('/signin')
    }
  }, [isAuthenticated])

  return <>{children}</>
}
