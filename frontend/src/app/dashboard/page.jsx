'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, BookOpen, Trash2, Play, Globe, Lock, Loader2, Brain } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/auth/useAuth'
import { useQuiz } from '@/hooks/quiz/useQuiz'

function QuizCard({ quiz, onDelete, onPlay, deleteLoading }) {
  const diffColor = { easy: 'text-green-400 bg-green-400/10', medium: 'text-yellow-400 bg-yellow-400/10', hard: 'text-red-400 bg-red-400/10' }
  return (
    <div className="bg-[#0F3460]/30 border border-[#0F3460] rounded-2xl p-6 hover:border-[#E94560]/50 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg truncate">{quiz.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{quiz.topic}</p>
        </div>
        <div className="flex items-center gap-1 ml-3">
          {quiz.isPublic
            ? <Globe size={14} className="text-green-400" />
            : <Lock size={14} className="text-gray-500" />}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${diffColor[quiz.difficulty]}`}>
          {quiz.difficulty}
        </span>
        <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
          {quiz.totalQuestions} questions
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/quiz/${quiz._id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E94560] hover:bg-[#c73652] text-white text-sm font-medium py-2.5 rounded-xl transition-all"
        >
          <Play size={14} />
          View & Play
        </Link>
        <button
          onClick={() => onDelete(quiz._id)}
          disabled={deleteLoading}
          className="p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user }                                    = useAuth()
  const { quizzes, listLoading, deleteLoading, loadMyQuizzes, removeQuiz } = useQuiz()

  useEffect(() => { loadMyQuizzes() }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f0f4ff]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A2E]">
                Welcome back, <span className="text-[#E94560]">{user?.name?.split(' ')[0]}</span> 👋
              </h1>
              <p className="text-gray-500 mt-1">Manage your quizzes and host live rooms</p>
            </div>
            <Link
              href="/quiz/create"
              className="flex items-center gap-2 bg-[#E94560] hover:bg-[#c73652] text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#E94560]/20"
            >
              <PlusCircle size={18} />
              Create Quiz
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Quizzes', value: quizzes.length, color: 'bg-[#E94560]' },
              { label: 'Public Quizzes', value: quizzes.filter(q => q.isPublic).length, color: 'bg-green-500' },
              { label: 'Total Questions', value: quizzes.reduce((a, q) => a + q.totalQuestions, 0), color: 'bg-blue-500' },
              { label: 'Avg Difficulty', value: 'Mixed', color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-8 h-1 ${color} rounded-full mb-3`} />
                <div className="text-2xl font-bold text-[#1A1A2E]">{value}</div>
                <div className="text-gray-500 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Quiz list */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
              <BookOpen size={20} className="text-[#E94560]" />
              My Quizzes
            </h2>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#E94560]" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-[#E94560]/10 flex items-center justify-center mx-auto mb-4">
                <Brain size={32} className="text-[#E94560]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">No quizzes yet</h3>
              <p className="text-gray-500 mb-6">Create your first AI-powered quiz in seconds</p>
              <Link
                href="/quiz/create"
                className="inline-flex items-center gap-2 bg-[#E94560] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#c73652] transition-all"
              >
                <PlusCircle size={18} /> Create Your First Quiz
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz._id}
                  quiz={quiz}
                  onDelete={removeQuiz}
                  deleteLoading={deleteLoading}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
