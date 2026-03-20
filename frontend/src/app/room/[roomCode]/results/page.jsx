'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Trophy, Medal, Home, RotateCcw, Crown } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AuthGuard from '@/components/layout/AuthGuard'
import { selectGame, roomActions } from '@/redux/slices/room/roomSlice'
import { selectCurrentUser } from '@/redux/slices/auth/authSlice'

const RANK_COLORS  = ['#E94560', '#f59e0b', '#3b82f6']
const RANK_LABELS  = ['1st', '2nd', '3rd']
const RANK_ICONS   = [Crown, Medal, Medal]

export default function ResultsPage() {
  const { roomCode } = useParams()
  const router       = useRouter()
  const dispatch     = useDispatch()
  const game         = useSelector(selectGame)
  const currentUser  = useSelector(selectCurrentUser)

  const leaderboard = game.finalResult?.finalLeaderboard || game.leaderboard || []
  const winner      = game.finalResult?.winner || leaderboard[0]
  const myRank      = leaderboard.findIndex(p => p.userId === currentUser?._id) + 1
  const myScore     = leaderboard.find(p => p.userId === currentUser?._id)?.score || 0
  const isWinner    = winner?.userId === currentUser?._id

  const handleLeave = () => {
    dispatch(roomActions.resetGame())
    router.push('/dashboard')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#1A1A2E]">
        <main className="max-w-2xl mx-auto px-4 py-10">

          {/* Winner announcement */}
          <div className="text-center mb-10">
            {isWinner ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-4xl font-bold text-white mb-2">You Won!</h1>
                <p className="text-gray-400">Congratulations, you topped the leaderboard!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  <span className="text-[#E94560]">{winner?.name}</span> wins!
                </h1>
                <p className="text-gray-400">
                  You finished #{myRank} with {myScore} points
                </p>
              </>
            )}
          </div>

          {/* Top 3 podium */}
          {leaderboard.length >= 1 && (
            <div className="flex items-end justify-center gap-4 mb-10">
              {[1, 0, 2].map((rankIdx) => {
                const player = leaderboard[rankIdx]
                if (!player) return <div key={rankIdx} className="w-24" />
                const Icon   = RANK_ICONS[rankIdx]
                const height = rankIdx === 0 ? 'h-28' : rankIdx === 1 ? 'h-20' : 'h-16'
                return (
                  <div key={player.userId} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                    <Icon size={20} style={{ color: RANK_COLORS[rankIdx] }} />
                    <div className="w-12 h-12 rounded-full bg-[#0F3460] border-2 flex items-center justify-center text-white font-bold"
                      style={{ borderColor: RANK_COLORS[rankIdx] }}>
                      {player.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium text-center truncate w-full text-center">
                      {player.name}
                    </span>
                    <div className={`w-full ${height} rounded-t-xl flex items-end justify-center pb-2`}
                      style={{ backgroundColor: RANK_COLORS[rankIdx] + '30', border: `1px solid ${RANK_COLORS[rankIdx]}50` }}>
                      <span className="font-bold" style={{ color: RANK_COLORS[rankIdx] }}>{player.score}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{RANK_LABELS[rankIdx]}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Score chart */}
          {leaderboard.length > 0 && (
            <div className="bg-[#0F3460]/30 border border-[#0F3460] rounded-2xl p-6 mb-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-[#E94560]" /> Score Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaderboard} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0F3460', border: 'none', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {leaderboard.map((entry, i) => (
                      <Cell key={i} fill={entry.userId === currentUser?._id ? '#E94560' : '#0F3460'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Full leaderboard */}
          <div className="bg-[#0F3460]/30 border border-[#0F3460] rounded-2xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-[#0F3460]">
              <h2 className="text-white font-semibold">Final Standings</h2>
            </div>
            {leaderboard.map((player, i) => (
              <div
                key={player.userId}
                className={`flex items-center justify-between px-6 py-4 border-b border-[#0F3460]/50 last:border-0 ${
                  player.userId === currentUser?._id ? 'bg-[#E94560]/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold w-8"
                    style={{ color: i < 3 ? RANK_COLORS[i] : '#6b7280' }}>
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#0F3460] flex items-center justify-center text-white font-bold text-sm">
                    {player.name?.[0]?.toUpperCase()}
                  </div>
                  <span className={`font-medium ${player.userId === currentUser?._id ? 'text-[#E94560]' : 'text-white'}`}>
                    {player.name} {player.userId === currentUser?._id && '(you)'}
                  </span>
                </div>
                <span className="text-white font-bold text-lg">{player.score}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleLeave}
              className="flex-1 flex items-center justify-center gap-2 bg-[#E94560] hover:bg-[#c73652] text-white font-semibold py-4 rounded-xl transition-all"
            >
              <Home size={18} /> Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
