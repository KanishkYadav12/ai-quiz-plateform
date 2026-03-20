"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Trophy,
  Zap,
  Medal,
  Crown,
  Loader2,
  TrendingUp,
  User,
  Search,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import {
  fetchCoinsLeaderboard,
  fetchRatioLeaderboard,
} from "@/redux/actions/user/userAction";
import {
  selectCoinsLeaderboard,
  selectRatioLeaderboard,
} from "@/redux/slices/user/userSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";
import Link from "next/link";

const RANK_COLORS = ["var(--gold)", "var(--silver)", "var(--bronze)"];

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const coinsOp = useSelector(selectCoinsLeaderboard);
  const ratioOp = useSelector(selectRatioLeaderboard);

  const [activeTab, setActiveTab] = useState("coins"); // 'coins' | 'ratio'

  useEffect(() => {
    dispatch(fetchCoinsLeaderboard());
    dispatch(fetchRatioLeaderboard());
  }, [dispatch]);

  const activeData = activeTab === "coins" ? coinsOp.data : ratioOp.data;
  const isLoading = activeTab === "coins" ? coinsOp.status === "pending" : ratioOp.status === "pending";

  const podium = activeData?.slice(0, 3) || [];
  const list = activeData?.slice(3) || [];
  const myPlayer = activeData?.find(u => u._id === currentUser?._id);
  const myRank = activeData?.findIndex(u => u._id === currentUser?._id) + 1;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-12">

          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h1 className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tight mb-2">Global Arena</h1>
              <p className="text-[var(--text-secondary)] font-medium">Top performers across the platform</p>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-1.5 rounded-2xl flex gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab("coins")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === "coins"
                    ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Trophy size={16} /> Total Coins
              </button>
              <button
                onClick={() => setActiveTab("ratio")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === "ratio"
                    ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Zap size={16} /> Skill Ratio
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-40">
               <Loader2 size={48} className="animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : (
            <>
              {/* Podium View */}
              {podium.length > 0 && (
                <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 px-4">
                  {/* 2nd Place */}
                  {podium[1] && (
                    <div className="order-2 md:order-1 flex flex-col items-center group flex-1 max-w-[200px]">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--silver)] flex items-center justify-center text-3xl font-black text-[var(--text-primary)] shadow-lg group-hover:-translate-y-2 transition-transform">
                           {podium[1].name[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--silver)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-white text-xs font-black">2</div>
                      </div>
                      <p className="font-bold text-[var(--text-primary)] truncate w-full text-center">{podium[1].name}</p>
                      <div className="h-24 w-full bg-gradient-to-t from-[var(--silver)]/20 to-transparent rounded-t-2xl mt-4 border-x border-t border-[var(--silver)]/30 flex flex-col items-center justify-center">
                         <span className="font-black text-[var(--text-primary)] mono">
                            {activeTab === 'coins' ? podium[1].totalCoins : podium[1].coinRatio.toFixed(1)}
                         </span>
                         <span className="text-[8px] font-black uppercase text-[var(--text-disabled)]">{activeTab === 'coins' ? 'Coins' : 'Ratio'}</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {podium[0] && (
                    <div className="order-1 md:order-2 flex flex-col items-center group flex-1 max-w-[240px]">
                      <div className="relative mb-6 scale-110">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[var(--gold)] drop-shadow-[0_0_10px_rgba(191,135,0,0.5)]">
                           <Crown size={40} fill="currentColor" />
                        </div>
                        <div className="w-24 h-24 rounded-[2rem] bg-[var(--bg-secondary)] border-4 border-[var(--gold)] flex items-center justify-center text-4xl font-black text-[var(--text-primary)] shadow-2xl group-hover:-translate-y-2 transition-transform">
                           {podium[0].name[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[var(--gold)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-white text-sm font-black">1</div>
                      </div>
                      <p className="font-black text-[var(--text-primary)] text-lg truncate w-full text-center">{podium[0].name}</p>
                      <div className="h-32 w-full bg-gradient-to-t from-[var(--gold)]/20 to-transparent rounded-t-2xl mt-4 border-x border-t border-[var(--gold)]/30 flex flex-col items-center justify-center">
                         <span className="font-black text-2xl text-[var(--text-primary)] mono">
                            {activeTab === 'coins' ? podium[0].totalCoins : podium[0].coinRatio.toFixed(1)}
                         </span>
                         <span className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-widest">{activeTab === 'coins' ? 'Coins' : 'Ratio'}</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {podium[2] && (
                    <div className="order-3 flex flex-col items-center group flex-1 max-w-[200px]">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--bronze)] flex items-center justify-center text-3xl font-black text-[var(--text-primary)] shadow-lg group-hover:-translate-y-2 transition-transform">
                           {podium[2].name[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--bronze)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-white text-xs font-black">3</div>
                      </div>
                      <p className="font-bold text-[var(--text-primary)] truncate w-full text-center">{podium[2].name}</p>
                      <div className="h-20 w-full bg-gradient-to-t from-[var(--bronze)]/20 to-transparent rounded-t-2xl mt-4 border-x border-t border-[var(--bronze)]/30 flex flex-col items-center justify-center">
                         <span className="font-black text-[var(--text-primary)] mono">
                            {activeTab === 'coins' ? podium[2].totalCoins : podium[2].coinRatio.toFixed(1)}
                         </span>
                         <span className="text-[8px] font-black uppercase text-[var(--text-disabled)]">{activeTab === 'coins' ? 'Coins' : 'Ratio'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* List View */}
              <div className="card bg-[var(--bg-secondary)] border-[var(--border)] overflow-hidden shadow-xl mb-12">
                <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/30 flex items-center justify-between">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-disabled)]">Full Standings</h2>
                   <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] pr-4">
                      <span className="w-20 text-center">Activity</span>
                      <span className="w-20 text-right">Value</span>
                   </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {list.map((user, i) => (
                    <Link
                      href={`/profile/${user._id}`}
                      key={user._id}
                      className={`flex items-center justify-between px-8 py-5 hover:bg-[var(--bg-tertiary)]/50 transition-all group ${user._id === currentUser?._id ? 'bg-[var(--accent-muted)]' : ''}`}
                    >
                      <div className="flex items-center gap-6">
                        <span className="w-8 font-black text-[var(--text-disabled)] mono">{String(i + 4).padStart(2, '0')}</span>
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-black text-sm group-hover:border-[var(--accent-primary)] transition-colors">
                           {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${user._id === currentUser?._id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{user.name}</p>
                          {user._id === currentUser?._id && <span className="text-[8px] font-black uppercase text-[var(--accent-primary)]">Your Global Rank</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                         <div className="hidden sm:flex flex-col items-center w-20 opacity-50">
                            <span className="text-[8px] font-black uppercase text-[var(--text-disabled)]">{user.gamesPlayed} Games</span>
                            <TrendingUp size={12} className="text-[var(--success)]" />
                         </div>
                         <div className="w-20 text-right">
                            <span className="font-black text-xl text-[var(--text-primary)] mono">
                               {activeTab === 'coins' ? user.totalCoins : user.coinRatio.toFixed(1)}
                            </span>
                         </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Current User Fixed Row (if outside top 100) */}
              {myPlayer && myRank > 100 && (
                <div className="card p-6 bg-[var(--accent-primary)] border-none shadow-2xl flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                        {myRank}
                      </div>
                      <div className="text-white">
                         <p className="font-black text-xl uppercase tracking-tight">Your Global Position</p>
                         <p className="text-white/60 text-xs font-bold">Keep competing to climb the ranks!</p>
                      </div>
                   </div>
                   <div className="text-right text-white">
                      <p className="text-[10px] font-bold uppercase opacity-60">Your {activeTab === 'coins' ? 'Total Coins' : 'Skill Ratio'}</p>
                      <p className="text-4xl font-black mono">{activeTab === 'coins' ? myPlayer.totalCoins : myPlayer.coinRatio.toFixed(1)}</p>
                   </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'ratio' && (
            <div className="mt-8 p-6 bg-[var(--warning-muted)] border border-[var(--warning)]/20 rounded-2xl">
               <p className="text-xs font-bold text-[var(--warning)] flex items-center gap-2">
                 <ShieldCheck size={14} /> Minimum 5 games required to appear on Skill Ratio leaderboard
               </p>
            </div>
          )}

        </main>
      </div>
    </AuthGuard>
  );
}

function ShieldCheck({ size, className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
}
