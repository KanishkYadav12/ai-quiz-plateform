"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Trophy,
  Target,
  Zap,
  Calendar,
  Loader2,
  TrendingUp,
  History,
  ShieldCheck,
  Medal,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { fetchUserProfile } from "@/redux/actions/user/userAction";
import { selectUserProfile, userActions } from "@/redux/slices/user/userSlice";

// Duplicating BADGE icons here since frontend can't easily import from backend/src in all environments
const BADGE_ICONS = {
  FIRST_WIN: { icon: "🏆", name: "First Win", condition: "Win your first quiz" },
  HOT_STREAK: { icon: "🔥", name: "Hot Streak", condition: "5 correct answers in a row" },
  SPEED_DEMON: { icon: "⚡", name: "Speed Demon", condition: "Avg time < 5s" },
  PERFECT: { icon: "🎯", name: "Perfect", condition: "100% correct (10+ Qs)" },
  CHAMPION: { icon: "👑", name: "Champion", condition: "Win 10 quizzes" },
  VETERAN: { icon: "🌟", name: "Veteran", condition: "Play 50 quizzes" },
  SCHOLAR: { icon: "📚", name: "Scholar", condition: "Create 10 public quizzes" },
  SOCIAL: { icon: "🤝", name: "Social", condition: "Room with 5+ players" },
  UNSTOPPABLE: { icon: "💪", name: "Unstoppable", condition: "Win 3 quizzes in a row" },
  COIN_LORD: { icon: "💰", name: "Coin Lord", condition: "1000 total coins" },
};

export default function ProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const profileOp = useSelector(selectUserProfile);

  useEffect(() => {
    dispatch(fetchUserProfile(userId));
    return () => dispatch(userActions.clearProfile());
  }, [userId, dispatch]);

  if (profileOp.status === "pending") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col page-enter">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  const data = profileOp.data;
  if (!data) return null;

  const { user, recentGames } = data;
  const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-12">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-all font-bold text-sm mb-10 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
             <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--accent-primary)] flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                   {user.name[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[var(--bg-secondary)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-[var(--gold)] shadow-lg">
                   <Trophy size={20} fill="currentColor" />
                </div>
             </div>

             <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tight mb-2">{user.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold text-[var(--text-secondary)]">
                   <span className="flex items-center gap-1.5"><Calendar size={14} /> Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                   <span className="opacity-20 hidden md:inline">•</span>
                   <span className="flex items-center gap-1.5 text-[var(--gold)]"><Trophy size={14} fill="currentColor" /> {user.totalCoins} Coins</span>
                </div>
             </div>

             <div className="flex gap-2">
                <button className="btn-primary px-6 py-2.5">Follow</button>
                <button className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all"><Zap size={18} /></button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

             {/* Stats Grid */}
             <div className="lg:col-span-2 space-y-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                   {[
                     { label: 'Played', value: user.gamesPlayed, icon: History, color: 'text-blue-500' },
                     { label: 'Won', value: user.gamesWon, icon: Crown, color: 'text-[var(--gold)]' },
                     { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-[var(--success)]' },
                     { label: 'Ratio', value: user.coinRatio.toFixed(1), icon: TrendingUp, color: 'text-purple-500' },
                   ].map((stat) => (
                     <div key={stat.label} className="card p-5 bg-[var(--bg-secondary)] border-[var(--border)] text-center">
                        <div className={`flex justify-center mb-3 ${stat.color}`}>
                           <stat.icon size={20} />
                        </div>
                        <div className="text-2xl font-black text-[var(--text-primary)] mono">{stat.value}</div>
                        <div className="text-[10px] font-black uppercase text-[var(--text-disabled)] tracking-widest">{stat.label}</div>
                     </div>
                   ))}
                </div>

                {/* Badge Showcase */}
                <section>
                   <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3 mb-6">
                      <Medal size={20} className="text-[var(--gold)]" />
                      Badge Collection
                   </h2>
                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {Object.entries(BADGE_ICONS).map(([id, info]) => {
                        const earned = user.badges.includes(id);
                        return (
                          <div
                            key={id}
                            className={`card p-6 flex flex-col items-center gap-3 transition-all relative group ${earned ? 'bg-[var(--bg-secondary)] border-[var(--gold)]/30' : 'bg-[var(--bg-secondary)] border-[var(--border)] opacity-40 grayscale'}`}
                          >
                             <div className={`text-3xl ${earned ? 'drop-shadow-[0_0_10px_rgba(191,135,0,0.3)] group-hover:scale-110 transition-transform' : ''}`}>
                                {info.icon}
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-black text-[var(--text-primary)] truncate w-full">{info.name}</p>
                                <p className="text-[8px] font-bold text-[var(--text-disabled)] uppercase tracking-tight leading-tight mt-1">{info.condition}</p>
                             </div>
                             {!earned && <Lock size={12} className="absolute top-2 right-2 text-[var(--text-disabled)]" />}
                          </div>
                        )
                      })}
                   </div>
                </section>

                {/* Recent Activity */}
                <section>
                   <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3 mb-6">
                      <History size={20} className="text-[var(--accent-primary)]" />
                      Recent Activity
                   </h2>
                   <div className="card bg-[var(--bg-secondary)] border-[var(--border)] overflow-hidden">
                      {recentGames.length === 0 ? (
                        <div className="p-12 text-center text-[var(--text-disabled)] italic">No recent game history found.</div>
                      ) : (
                        <div className="divide-y divide-[var(--border)]">
                           {recentGames.map((game, i) => (
                             <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)]/30 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${game.placement === 1 ? 'bg-[var(--gold)]/10 text-[var(--gold)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-disabled)]'}`}>
                                      {game.placement}
                                   </div>
                                   <div>
                                      <p className="font-bold text-[var(--text-primary)]">{game.quizTitle}</p>
                                      <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">{new Date(game.date).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="font-black text-[var(--text-primary)] mono">{game.score} PTS</p>
                                   <p className="text-[10px] font-black text-[var(--success)] uppercase tracking-widest">+{game.placement === 1 ? 100 : game.placement === 2 ? 60 : 40} Coins</p>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </section>
             </div>

             {/* Side Column: Performance Chart Placeholder */}
             <div className="space-y-10">
                <div className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
                   <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-disabled)] mb-6">Expertise Level</h3>
                   <div className="space-y-6">
                      {[
                        { label: 'Best Score', value: user.bestScore, max: 1500, color: 'bg-[var(--accent-primary)]' },
                        { label: 'Total Score', value: user.totalScore, max: user.gamesPlayed * 1000, color: 'bg-purple-500' },
                      ].map(bar => (
                        <div key={bar.label}>
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-xs font-bold text-[var(--text-primary)]">{bar.label}</span>
                              <span className="text-sm font-black mono text-[var(--text-primary)]">{bar.value}</span>
                           </div>
                           <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                              <div className={`h-full ${bar.color}`} style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="card p-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border-[var(--border)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                      <ShieldCheck size={80} />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-disabled)] mb-4">Security Status</h3>
                   <div className="flex items-center gap-3 text-[var(--success)]">
                      <ShieldCheck size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">Verified Player</span>
                   </div>
                </div>
             </div>

          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function Crown({ size, className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
}
