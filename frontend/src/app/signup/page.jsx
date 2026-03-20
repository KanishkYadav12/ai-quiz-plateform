'use client'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Mail, Lock, Loader2, User, ChevronRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'

const schema = z.object({
  name:     z.string().min(2, 'Full name is required'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function SignUpPage() {
  const { register: registerUser, registerLoading } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values) => registerUser(values)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex page-enter">
      {/* Left panel — Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-20 bg-[var(--bg-secondary)] border-r border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-primary)]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--success)] opacity-5 blur-[100px]" />

        <div className="flex items-center gap-3 mb-12 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
            <Brain size={32} className="text-white" />
          </div>
          <span className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tighter">Quiz<span className="text-[var(--accent-primary)]">AI</span></span>
        </div>

        <h2 className="text-6xl font-black text-[var(--text-primary)] mb-8 leading-[1.1] font-display tracking-tight">
          Join the <span className="text-[var(--accent-primary)]">Future</span><br />of Learning.
        </h2>

        <p className="text-xl text-[var(--text-secondary)] mb-12 font-medium leading-relaxed max-w-lg">
          Create your account today and start competing in real-time AI-powered quiz arenas.
        </p>

        <div className="card p-8 bg-[var(--bg-primary)] border-[var(--border)] relative z-10 max-w-sm">
           <div className="flex items-center gap-2 text-[var(--gold)] mb-4">
              {[1,2,3,4,5].map(i => <Sparkles key={i} size={16} fill="currentColor" />)}
           </div>
           <p className="text-[var(--text-primary)] font-bold italic mb-4">&quot;The best multiplayer quiz experience I&apos;ve had. AI questions are surprisingly smart!&quot;</p>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)]" />
              <div>
                 <p className="text-sm font-black text-[var(--text-primary)]">Alex Rivera</p>
                 <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">Beta Tester</p>
              </div>
           </div>
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
            <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 font-display tracking-tight">Get Started</h1>
            <p className="text-[var(--text-secondary)] font-medium">Create your profile to start hosting quizzes</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] ml-1">Full Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] font-bold placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--bg-primary)] transition-all"
                />
              </div>
              {errors.name && <p className="text-[var(--error)] text-xs font-bold mt-1 ml-1">{errors.name.message}</p>}
            </div>

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
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] ml-1">Secure Password</label>
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
              disabled={registerLoading}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent-primary)]/20 mt-4 group"
            >
              {registerLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Create Free Account
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
            <p className="text-[var(--text-secondary)] font-medium">
              Already have an account?{' '}
              <Link href="/signin" className="text-[var(--accent-primary)] font-black hover:underline ml-1 uppercase tracking-widest text-xs">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
