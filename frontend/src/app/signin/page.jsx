'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Mail, Lock, Loader2, Sparkles, ShieldCheck, Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function SignInPage() {
  const { login, loginLoading } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values) => login(values)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex page-enter">
      {/* Left panel — Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-20 bg-[var(--bg-secondary)] border-r border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-primary)]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[var(--accent-primary)] opacity-5 blur-[100px]" />

        <div className="flex items-center gap-3 mb-12 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
            <Brain size={32} className="text-white" />
          </div>
          <span className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tighter">Quiz<span className="text-[var(--accent-primary)]">AI</span></span>
        </div>

        <h2 className="text-6xl font-black text-[var(--text-primary)] mb-8 leading-[1.1] font-display tracking-tight">
          Where <span className="text-[var(--accent-primary)]">Intelligence</span><br />meets Competition.
        </h2>

        <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium leading-relaxed max-w-lg">
          Join thousands of players in real-time AI-generated challenges. Create, compete, and climb the global ranks.
        </p>

        <div className="space-y-6 relative z-10">
          {[
            { icon: Sparkles, text: 'AI-Generated adaptive questions', color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-muted)]' },
            { icon: Zap, text: 'Real-time multiplayer synchronization', color: 'text-[var(--gold)]', bg: 'bg-[var(--warning-muted)]' },
            { icon: ShieldCheck, text: 'Advanced anti-cheat protection', color: 'text-[var(--success)]', bg: 'bg-[var(--success-muted)]' }
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-4 text-[var(--text-primary)] font-bold">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center ${f.color} border border-transparent group-hover:border-current transition-all shadow-sm`}>
                <f.icon size={20} fill="currentColor" fillOpacity={0.2} />
              </div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg">
              <Brain size={36} className="text-white" />
            </div>
            <span className="text-3xl font-black text-[var(--text-primary)] font-display">QuizAI</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 font-display tracking-tight">Welcome back</h1>
            <p className="text-[var(--text-secondary)] font-medium">Continue your journey to the top of the leaderboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] font-bold placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all"
                />
              </div>
              {errors.email && <p className="text-[var(--error)] text-xs font-bold mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Password</label>
                <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)] hover:underline">Forgot?</Link>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] font-bold placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all"
                />
              </div>
              {errors.password && <p className="text-[var(--error)] text-xs font-bold mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent-primary)]/20 mt-4 group"
            >
              {loginLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
            <p className="text-[var(--text-secondary)] font-medium">
              New to the platform?{' '}
              <Link href="/signup" className="text-[var(--accent-primary)] font-black hover:underline ml-1 uppercase tracking-widest text-xs">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
