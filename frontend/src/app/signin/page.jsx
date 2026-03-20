'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function SignInPage() {
  const { login, loginLoading } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values) => login(values)

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#E94560] flex items-center justify-center">
            <Brain size={24} className="text-white" />
          </div>
          <span className="text-3xl font-bold text-white">Quiz<span className="text-[#E94560]">AI</span></span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
          Challenge friends with<br />
          <span className="text-[#E94560]">AI-generated</span> quizzes
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Create quizzes on any topic in seconds, host live multiplayer rooms, and watch leaderboards update in real time.
        </p>
        <div className="flex flex-col gap-3">
          {['AI generates questions instantly', 'Live multiplayer up to 20 players', 'Real-time leaderboard updates'].map((f) => (
            <div key={f} className="flex items-center gap-3 text-gray-300">
              <div className="w-5 h-5 rounded-full bg-[#E94560]/20 border border-[#E94560] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#E94560]" />
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#E94560] flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Quiz<span className="text-[#E94560]">AI</span></span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400 mb-8">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-[#0F3460]/50 border border-[#0F3460] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E94560] transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#0F3460]/50 border border-[#0F3460] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#E94560] transition-colors"
                />
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#E94560] hover:bg-[#c73652] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loginLoading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#E94560] hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
