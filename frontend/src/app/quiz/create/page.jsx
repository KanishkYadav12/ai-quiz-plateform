'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/layout/AuthGuard'
import { useQuiz } from '@/hooks/quiz/useQuiz'

const schema = z.object({
  title:          z.string().min(3, 'Title must be at least 3 characters'),
  topic:          z.string().min(2, 'Topic must be at least 2 characters'),
  difficulty:     z.enum(['easy', 'medium', 'hard']),
  totalQuestions: z.coerce.number().min(5).max(20),
  timePerQuestion: z.coerce.number().min(10).max(60),
})

export default function CreateQuizPage() {
  const { generate, createLoading } = useQuiz()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: 'medium', totalQuestions: 10, timePerQuestion: 30 },
  })

  const onSubmit = (values) => generate(values)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f0f4ff]">
        <Navbar />

        {/* AI generation loading overlay */}
        {createLoading && (
          <div className="fixed inset-0 bg-[#1A1A2E]/90 z-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E94560]/20 border border-[#E94560] flex items-center justify-center animate-pulse">
              <Sparkles size={32} className="text-[#E94560]" />
            </div>
            <h2 className="text-white text-2xl font-bold">Generating your quiz...</h2>
            <p className="text-gray-400">AI is crafting {'{'}questions{'}'} for you. This takes a few seconds.</p>
            <div className="flex gap-2 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        <main className="max-w-2xl mx-auto px-4 py-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] mb-8 transition-colors">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E94560]/10 flex items-center justify-center">
                <Sparkles size={20} className="text-[#E94560]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Create AI Quiz</h1>
                <p className="text-gray-500 text-sm">Powered by Gemini AI</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                <input
                  {...register('title')}
                  placeholder="e.g. JavaScript Fundamentals Quiz"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#E94560] transition-colors"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  {...register('topic')}
                  placeholder="e.g. JavaScript, World History, Biology..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#E94560] transition-colors"
                />
                {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <label key={d} className="cursor-pointer">
                      <input {...register('difficulty')} type="radio" value={d} className="sr-only peer" />
                      <div className="text-center py-3 rounded-xl border-2 border-gray-200 peer-checked:border-[#E94560] peer-checked:bg-[#E94560]/5 transition-all capitalize font-medium text-gray-600 peer-checked:text-[#E94560]">
                        {d}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                <select
                  {...register('totalQuestions')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#E94560] transition-colors"
                >
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>

              {/* Time per question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time per Question (seconds)</label>
                <select
                  {...register('timePerQuestion')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#E94560] transition-colors"
                >
                  {[15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} seconds</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-[#E94560] hover:bg-[#c73652] disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
              >
                <Sparkles size={20} />
                Generate Quiz with AI
              </button>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
