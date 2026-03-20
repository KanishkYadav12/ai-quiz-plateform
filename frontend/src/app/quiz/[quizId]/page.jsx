'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, BarChart3, Users, Trophy, Target, Calendar, Play, Loader2, ArrowLeft, Globe, Lock, CheckCircle2, MoreVertical, LayoutGrid, LayoutList, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/layout/AuthGuard'
import { useQuiz } from '@/hooks/quiz/useQuiz'
import { useRoom } from '@/hooks/room/useRoom'

export default function QuizAnalyticsPage() {
  const { quizId } = useParams()
  const router = useRouter()
  const { analytics, analyticsLoading, loadAnalytics, publishQuiz } = useQuiz()
  const { makeRoom, createLoading } = useRoom()
  const [expandedQuestion, setExpandedQuestion] = useState(null)

  useEffect(() => {
    loadAnalytics(quizId)
  }, [quizId])

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col page-enter">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const { quiz, rooms, stats } = analytics

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {createLoading && (
            <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/80 backdrop-blur-sm flex items-center justify-center">
              <div className="card p-10 flex flex-col items-center gap-6 shadow-2xl border-[var(--border-strong)]">
                <Loader2 size={48} className="animate-spin text-[var(--accent-primary)]" />
                <p className="font-bold text-[var(--text-primary)] text-lg">Initializing Live Room...</p>
              </div>
            </div>
          )}

          {/* Breadcrumbs & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tight truncate">{quiz.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--text-secondary)]">
                <span className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg border border-[var(--border)]">{quiz.topic}</span>
                <span className="mx-1 opacity-30">•</span>
                <span className={`uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-lg border border-transparent ${quiz.difficulty === 'easy' ? 'bg-[var(--success-muted)] text-[var(--success)]' : quiz.difficulty === 'medium' ? 'bg-[var(--warning-muted)] text-[var(--warning)]' : 'bg-[var(--error-muted)] text-[var(--error)]'}`}>
                  {quiz.difficulty}
                </span>
                <span className="mx-1 opacity-30">•</span>
                <span>{quiz.totalQuestions} Questions</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => publishQuiz(quiz._id, !quiz.isPublic)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${quiz.isPublic ? 'bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)] hover:bg-[var(--bg-secondary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-tertiary)]'}`}
              >
                {quiz.isPublic ? <Globe size={18} /> : <Lock size={18} />}
                {quiz.isPublic ? 'Publicly Listed' : 'Private Quiz'}
              </button>
              <button
                onClick={() => makeRoom({ quizId: quiz._id })}
                className="btn-primary flex items-center gap-2 px-8 py-2.5 shadow-lg shadow-[var(--accent-primary)]/20"
              >
                <Play size={18} fill="currentColor" />
                Host Live Room
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Times Played', value: stats.timesPlayed, icon: Play, color: 'var(--accent-primary)', bg: 'var(--accent-muted)' },
              { label: 'Participants', value: stats.totalParticipants, icon: Users, color: '#a855f7', bg: '#f3e8ff' },
              { label: 'Avg. Score', value: Math.round(stats.averageScore), icon: Target, color: 'var(--success)', bg: 'var(--success-muted)' },
              { label: 'Highest Score', value: stats.highestScore, icon: Trophy, color: 'var(--gold)', bg: 'var(--warning-muted)' },
            ].map((stat) => (
              <div key={stat.label} className="card p-6 flex items-center gap-6 bg-[var(--bg-secondary)] border-[var(--border)]">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-1">{stat.label}</div>
                  <div className="text-3xl font-black text-[var(--text-primary)] font-display">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content: Questions Analysis */}
            <div className="order-2 lg:order-1 lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                  <BarChart3 size={24} className="text-[var(--accent-primary)]" />
                  Performance Insights
                </h2>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-primary)]"><LayoutGrid size={18} /></button>
                  <button className="p-2 rounded-lg text-[var(--text-disabled)]"><LayoutList size={18} /></button>
                </div>
              </div>

              {stats.mostMissedQuestion && (
                <div className="card p-8 bg-[var(--error-muted)] border-[var(--error)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Target size={100} className="text-[var(--error)]" />
                  </div>
                  <div className="flex items-center gap-2 text-[var(--error)] font-black text-xs uppercase tracking-widest mb-4">
                    <Target size={16} />
                    Most Missed Question
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 leading-relaxed relative z-10">{stats.mostMissedQuestion.questionText}</h3>
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between text-sm font-bold mb-1">
                      <span className="text-[var(--error)]">Global Success Rate</span>
                      <span className="text-[var(--text-primary)]">{Math.round(stats.mostMissedQuestion.correctRate)}%</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-primary)] rounded-full border border-[var(--error)]/20 overflow-hidden">
                      <div className="h-full bg-[var(--error)] transition-all duration-1000" style={{ width: `${stats.mostMissedQuestion.correctRate}%` }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {quiz.questions.map((q, idx) => (
                  <div key={idx} className="card bg-[var(--bg-secondary)] border-[var(--border)] overflow-hidden">
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--bg-tertiary)] transition-all group"
                    >
                      <div className="flex items-start gap-5">
                        <span className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all flex items-center justify-center text-sm font-black text-[var(--text-secondary)] shrink-0 mono">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-bold text-[var(--text-primary)] text-lg leading-snug">{q.questionText}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">4 Options</span>
                          </div>
                        </div>
                      </div>
                      {expandedQuestion === idx ? <ChevronUp className="text-[var(--text-disabled)]" /> : <ChevronDown className="text-[var(--text-disabled)]" />}
                    </button>
                    {expandedQuestion === idx && (
                      <div className="px-6 pb-8 pt-2 border-t border-[var(--border)] bg-[var(--bg-primary)]/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                          {q.options.map((opt, i) => (
                            <div key={i} className={`p-4 rounded-xl border-2 font-bold text-sm flex items-center justify-between ${opt === q.correctAnswer ? 'bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)]' : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                              {opt}
                              {opt === q.correctAnswer && <CheckCircle2 size={16} />}
                            </div>
                          ))}
                        </div>
                        <div className="p-6 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent-primary)]/10">
                          <div className="flex items-center gap-2 text-[var(--accent-primary)] font-black text-[10px] uppercase tracking-widest mb-2">
                            <Sparkles size={14} /> AI Master Explanation
                          </div>
                          <p className="text-[var(--text-primary)] text-sm leading-relaxed font-medium">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Session History */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                  <Calendar size={24} className="text-[var(--accent-primary)]" />
                  History
                </h2>
                <button className="p-2 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"><MoreVertical size={20} /></button>
              </div>

              {rooms.length === 0 ? (
                <div className="card bg-[var(--bg-secondary)] border-dashed py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4 text-[var(--text-disabled)]">
                    <Calendar size={32} />
                  </div>
                  <p className="text-[var(--text-secondary)] font-bold">No sessions yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rooms.map((room) => {
                    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
                    const winner = sortedPlayers[0]
                    return (
                      <div key={room._id} className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)] group hover:border-[var(--accent-primary)] transition-all">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[var(--text-disabled)] uppercase tracking-wider mb-1">{new Date(room.completedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span className="mono font-bold text-xs text-[var(--accent-primary)]">#{room.roomCode}</span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                            <Trophy size={20} />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-black text-lg">
                            {winner?.userId?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">Winning Player</p>
                            <p className="font-bold text-[var(--text-primary)] truncate">{winner?.userId?.name || 'Unknown'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">Score</p>
                            <p className="font-black text-[var(--accent-primary)] text-xl mono">{winner?.score || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-[var(--border)]">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)] text-xs">
                            <Users size={14} /> {room.players.length} Players
                          </div>
                          <Link
                            href={`/room/${room.roomCode}/results`}
                            className="text-xs font-black text-[var(--accent-primary)] hover:text-[var(--accent-hover)] uppercase tracking-widest flex items-center gap-1"
                          >
                            Final Standings <ChevronDown size={14} className="-rotate-90" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
