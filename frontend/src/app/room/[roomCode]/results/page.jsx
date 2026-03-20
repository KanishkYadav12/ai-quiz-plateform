'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Trophy, Medal, Home, Crown, BarChart3, Users, Target, ArrowRight, Share2, Sparkles, Zap, ShieldAlert, Star } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AuthGuard from '@/components/layout/AuthGuard'
import { selectGame, roomActions } from '@/redux/slices/room/roomSlice'
import { selectCurrentUser } from '@/redux/slices/auth/authSlice'
import { useQuiz } from '@/hooks/quiz/useQuiz'

const RANK_COLORS  = ['var(--gold)', 'var(--silver)', 'var(--bronze)']
const RANK_LABELS  = ['1st', '2nd', '3rd']
const RANK_ICONS   = [Crown, Medal, Medal]

export default function ResultsPage() {
  const { roomCode } = useParams()
  const router       = useRouter()
  const dispatch     = useDispatch()
  const game         = useSelector(selectGame)
  const currentUser  = useSelector(selectCurrentUser)
  const { submitRating, quiz } = useQuiz()

  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const leaderboard = [...(game.finalResult?.finalLeaderboard || game.leaderboard || [])].sort((a,b) => b.score - a.score)
  const winner      = game.finalResult?.winner || leaderboard[0]
  const myRank      = leaderboard.findIndex(p => p.userId === currentUser?._id) + 1
  const myScore     = leaderboard.find(p => p.userId === currentUser?._id)?.score || 0
  const myRewards   = game.finalResult?.rewards?.[currentUser?._id];
  const isWinner    = winner?.userId === currentUser?._id

  const handleLeave = () => {
    dispatch(roomActions.resetGame())
    router.push('/dashboard')
  }

  const onRate = (val) => {
    setUserRating(val)
    if (game.finalResult?.quizId || game.quizId) {
       submitRating(game.finalResult?.quizId || game.quizId, val)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <main className="max-w-4xl mx-auto px-6 py-12">

          {/* Winner Section */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
               <Trophy size={300} className="text-[var(--gold)]" />
            </div>

            {isWinner ? (
              <div className="relative z-10">
                <div className="text-7xl mb-6 animate-bounce">🎉</div>
                <h1 className="text-5xl font-black text-[var(--text-primary)] mb-4 font-display tracking-tight">Supreme Victory!</h1>
                <p className="text-[var(--text-secondary)] text-xl font-medium">You dominated the field with <span className="text-[var(--gold)] font-black mono">{myScore}</span> points.</p>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="text-7xl mb-6">🏆</div>
                <h1 className="text-5xl font-black text-[var(--text-primary)] mb-4 font-display tracking-tight">
                  <span className="text-[var(--accent-primary)]">{winner?.name}</span> wins!
                </h1>
                <p className="text-[var(--text-secondary)] text-xl font-medium">
                  You finished <span className="font-black text-[var(--text-primary)]">#{myRank}</span> with <span className="mono">{myScore}</span> points
                </p>
              </div>
            )}
          </div>

          {/* Podium Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

            {/* Stats Summary */}
            <div className="lg:col-span-2 space-y-6">
               <div className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3 mb-8">
                    <BarChart3 size={24} className="text-[var(--accent-primary)]" />
                    Performance Analytics
                  </h2>

                  {leaderboard.length > 0 && (
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={leaderboard.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}
                            cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                            {leaderboard.slice(0, 10).map((entry, i) => (
                              <Cell key={i} fill={entry.userId === currentUser?._id ? 'var(--accent-primary)' : 'var(--bg-tertiary)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-[var(--border)]">
                    <div className="text-center">
                       <div className="text-[10px] font-black uppercase text-[var(--text-disabled)] mb-1">Participants</div>
                       <div className="text-2xl font-black text-[var(--text-primary)] flex items-center justify-center gap-2">
                         <Users size={18} className="text-[var(--accent-primary)]" /> {leaderboard.length}
                       </div>
                    </div>
                    <div className="text-center">
                       <div className="text-[10px] font-black uppercase text-[var(--text-disabled)] mb-1">Top Score</div>
                       <div className="text-2xl font-black text-[var(--text-primary)] flex items-center justify-center gap-2">
                         <Trophy size={18} className="text-[var(--gold)]" /> {winner?.score || 0}
                       </div>
                    </div>
                    <div className="text-center">
                       <div className="text-[10px] font-black uppercase text-[var(--text-disabled)] mb-1">Average</div>
                       <div className="text-2xl font-black text-[var(--text-primary)] flex items-center justify-center gap-2">
                         <Target size={18} className="text-[var(--success)]" /> {Math.round(leaderboard.reduce((a,b)=>a+b.score,0)/leaderboard.length)}
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Top 3 List */}
          <div className="space-y-4 lg:sticky lg:top-24 h-fit">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-disabled)] px-2">Podium</h3>
              {leaderboard.slice(0, 3).map((player, i) => {
                const Icon = RANK_ICONS[i]
                return (
                  <div key={player.userId} className={`card p-6 bg-[var(--bg-secondary)] border-2 flex items-center gap-5 transition-all ${player.userId === currentUser?._id ? "border-[var(--accent-primary)]" : "border-[var(--border)]"}`}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl" style={{ backgroundColor: RANK_COLORS[i] + '20', color: RANK_COLORS[i] }}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">{RANK_LABELS[i]} Place</p>
                      <p className="font-bold text-[var(--text-primary)] truncate text-lg">{player.name}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-xl text-[var(--text-primary)] mono">{player.score}</p>
                    </div>
                  </div>
                )
              })}

              <button className="w-full card p-4 bg-[var(--bg-tertiary)] border-[var(--border)] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                <Share2 size={14} /> Share Results
              </button>
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="card bg-[var(--bg-secondary)] border-[var(--border)] overflow-hidden mb-12">
            <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/30">
              <h2 className="font-black uppercase tracking-widest text-sm text-[var(--text-primary)]">Complete Standings</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {leaderboard.map((player, i) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between px-8 py-5 transition-all ${
                    player.userId === currentUser?._id ? 'bg-[var(--accent-muted)]' : 'hover:bg-[var(--bg-tertiary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-xl font-black w-8 mono"
                      style={{ color: i < 3 ? RANK_COLORS[i] : 'var(--text-disabled)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm shadow-sm">
                      {player.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${player.userId === currentUser?._id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                          {player.name}
                        </span>
                        {player.isDisqualified && (
                          <span className="text-[10px] font-black text-[var(--error)] bg-[var(--error-muted)] px-2 py-0.5 rounded-lg border border-[var(--error)]/30 uppercase tracking-widest">Disqualified</span>
                        )}
                      </div>
                      {player.userId === currentUser?._id && (
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-[var(--accent-primary)] text-white px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="hidden sm:block text-right">
                        <p className="text-[8px] font-black text-[var(--text-disabled)] uppercase tracking-widest mb-1">Efficiency</p>
                        <p className="text-xs font-bold text-[var(--text-secondary)]">{Math.round((player.score / (game.totalQuestions * 150)) * 100)}%</p>
                     </div>
                     <span className="text-[var(--text-primary)] font-black text-2xl mono w-20 text-right">{player.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Section (Only if not host and public quiz) */}
          {game.hostId !== currentUser?._id && (
             <div className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)] mb-12 text-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-disabled)] mb-4">How was the Quiz?</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                   {[1,2,3,4,5].map(i => (
                     <button
                        key={i}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => onRate(i)}
                        className={`transition-all ${i <= (hoverRating || userRating) ? "text-[var(--gold)] scale-125" : "text-[var(--border-strong)]"}`}
                     >
                        <Star size={32} fill={i <= (hoverRating || userRating) ? "currentColor" : "none"} />
                     </button>
                   ))}
                </div>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-4 uppercase tracking-widest">
                   {userRating > 0 ? "Thanks for your feedback!" : "Tap to rate this quiz"}
                </p>
             </div>
          )}

          {/* Rewards Section */}
          {myRewards && (
            <div className="card p-8 bg-[var(--accent-muted)] border-[var(--accent-primary)] border-2 mb-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={100} className="text-[var(--accent-primary)]" />
               </div>

               <h2 className="text-xl font-black text-[var(--accent-primary)] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Zap size={20} fill="currentColor" /> Earnings This Game
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)]">
                       <span className="font-bold text-[var(--text-secondary)]">Placement Coins ({RANK_LABELS[myRank-1] || `${myRank}th`})</span>
                       <span className="font-black text-xl text-[var(--text-primary)]">+{myRewards.placement}</span>
                    </div>
                    {myRewards.bonuses?.map((bonus, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--success)]/20">
                         <span className="font-bold text-[var(--success)] flex items-center gap-2">
                           <Sparkles size={14} /> {bonus.name}
                         </span>
                         <span className="font-black text-lg text-[var(--success)]">+{bonus.amount}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center justify-center bg-[var(--bg-primary)] rounded-3xl p-6 border-2 border-[var(--accent-primary)]">
                     <p className="text-[10px] font-black uppercase text-[var(--text-disabled)] mb-1">Total Coins Earned</p>
                     <div className="text-5xl font-black text-[var(--accent-primary)] mono mb-4">
                        +{myRewards.total}
                     </div>
                     {myRewards.newBadges?.length > 0 && (
                       <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {myRewards.newBadges.map((badge) => (
                            <div key={badge.id} className="flex items-center gap-1.5 px-3 py-1 bg-[var(--gold)]/10 text-[var(--gold)] rounded-full border border-[var(--gold)]/20 animate-bounce">
                               <span className="text-sm">{badge.icon}</span>
                               <span className="text-[10px] font-black uppercase tracking-tighter">{badge.name}</span>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLeave}
              className="flex-1 flex items-center justify-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-sm"
            >
              <Home size={20} /> Return to Dashboard
            </button>
            <button
              onClick={() => router.push('/room/join')}
              className="flex-1 flex items-center justify-center gap-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-lg shadow-[var(--accent-primary)]/20"
            >
              Play Another <ArrowRight size={20} />
            </button>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
