'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Trash2, ChevronDown, ChevronUp, CheckCircle, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/layout/AuthGuard'
import { useQuiz } from '@/hooks/quiz/useQuiz'
import { useRoom } from '@/hooks/room/useRoom'

const diffColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }

function QuestionCard({ question, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-[#E94560]/10 text-[#E94560] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
          <span className="text-gray-900 font-medium">{question.questionText}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            {question.options.map((opt, i) => (
              <div key={i} className={`flex items-center gap-2 p-3 rounded-xl text-sm ${opt === question.correctAnswer ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                {opt === question.correctAnswer && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                {opt}
              </div>
            ))}
          </div>
          {question.explanation && (
            <p className="mt-4 text-sm text-gray-500 bg-blue-50 border border-blue-100 p-3 rounded-xl">
              💡 {question.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuizDetailPage() {
  const { quizId } = useParams()
  const router = useRouter()
  const { quiz, detailLoading, detailError, removeQuiz, deleteLoading, loadQuiz } = useQuiz()
  const { makeRoom, createLoading } = useRoom()

  useEffect(() => { if (quizId) loadQuiz(quizId) }, [quizId])

  const handleDelete = async () => {
    if (!confirm('Delete this quiz?')) return
    await removeQuiz(quizId)
    router.push('/dashboard')
  }

  if (detailLoading) return (
    <AuthGuard><div className="min-h-screen bg-[#f0f4ff]"><Navbar />
      <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#E94560]" /></div>
    </div></AuthGuard>
  )

  if (detailError || !quiz) return (
    <AuthGuard><div className="min-h-screen bg-[#f0f4ff]"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-red-500 mb-4">{detailError || 'Quiz not found'}</p>
        <Link href="/dashboard" className="text-[#E94560] hover:underline">Back to Dashboard</Link>
      </div>
    </div></AuthGuard>
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f0f4ff]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] mb-8 transition-colors">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">{quiz.title}</h1>
                <p className="text-gray-500 mt-1">{quiz.topic}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${diffColor[quiz.difficulty]}`}>{quiz.difficulty}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{quiz.totalQuestions} questions</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{quiz.timePerQuestion}s each</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => makeRoom({ quizId: quiz._id })}
                  disabled={createLoading}
                  className="flex items-center gap-2 bg-[#E94560] hover:bg-[#c73652] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                  Create Room
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="p-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Questions */}
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-4">Questions ({quiz.questions?.length})</h2>
          <div className="space-y-3">
            {quiz.questions?.map((q, i) => <QuestionCard key={i} question={q} index={i} />)}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
