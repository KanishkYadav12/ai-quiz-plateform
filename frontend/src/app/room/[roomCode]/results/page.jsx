"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Trophy,
  Crown,
  Home,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Timer,
  Medal,
  BarChart3,
  Coins,
  User,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import AuthGuard from "@/components/layout/AuthGuard";
import { selectGame, roomActions } from "@/redux/slices/room/roomSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";
import { roomService } from "@/services/room";

const rankLabel = (idx) => {
  if (idx === 0) return "1st";
  if (idx === 1) return "2nd";
  if (idx === 2) return "3rd";
  return `${idx + 1}th`;
};

const rankBadge = (idx) => {
  if (idx === 0) return "🥇";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return "";
};

const resolveStatsForUser = (stats, userId) => {
  if (!stats || !userId) return null;
  const key = userId.toString();
  if (stats[key]) return stats[key];
  const match = Object.entries(stats).find(([k]) => k.toString() === key);
  return match?.[1] || null;
};

const hasCompleteFinal = (result, userId = null) => {
  if (!result) return false;
  const hasLeaderboard = Array.isArray(result.finalLeaderboard);
  const hasStats =
    result.playerStats && Object.keys(result.playerStats).length > 0;
  const hasAnalytics =
    result.quizAnalytics && result.quizAnalytics.totalQuestions > 0;
  const hasCurrentUser = userId
    ? !!resolveStatsForUser(result.playerStats, userId)
    : true;
  return hasLeaderboard && hasStats && hasAnalytics && hasCurrentUser;
};

export default function ResultsPage() {
  const { roomCode } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const game = useSelector(selectGame);
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id?.toString();
  const [expandedQuestions, setExpandedQuestions] = useState(true);
  const [fetchedFinal, setFetchedFinal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const loadCanonicalFinal = async () => {
      if (!roomCode) return;
      if (hasCompleteFinal(game.finalResult, currentUserId)) return;

      try {
        const res = await roomService.getByCode(roomCode);
        const room = res?.data?.room;
        const canonical = room?.finalResult;
        if (!cancelled && canonical) {
          setFetchedFinal(canonical);
        }
      } catch {
        // Keep rendering socket state fallback.
      }
    };

    loadCanonicalFinal();

    if (!hasCompleteFinal(game.finalResult, currentUserId)) {
      timerId = setInterval(loadCanonicalFinal, 1500);
    }

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [roomCode, game.finalResult, currentUserId]);

  const final = hasCompleteFinal(game.finalResult, currentUserId)
    ? game.finalResult
    : fetchedFinal || {};
  const finalLeaderboard = useMemo(
    () =>
      [...(final.finalLeaderboard || game.leaderboard || [])].sort(
        (a, b) => b.score - a.score,
      ),
    [final.finalLeaderboard, game.leaderboard],
  );

  const winner = final.winner || finalLeaderboard[0] || null;
  const playerStats = final.playerStats || {};
  const myStats = resolveStatsForUser(playerStats, currentUserId);
  const quizAnalytics = final.quizAnalytics || {
    totalQuestions: 0,
    questionStats: [],
  };

  const myRank = finalLeaderboard.findIndex((p) => p.userId === currentUserId);
  const myScore =
    myStats?.score ??
    finalLeaderboard.find((p) => p.userId === currentUserId)?.score ??
    0;
  const totalQuestions =
    quizAnalytics.totalQuestions || myStats?.answers?.length || 0;
  const myCorrectRate =
    totalQuestions > 0
      ? Math.round(((myStats?.correct || 0) / totalQuestions) * 100)
      : 0;

  const hardest = useMemo(() => {
    if (!quizAnalytics.questionStats?.length) return null;
    return [...quizAnalytics.questionStats].sort(
      (a, b) => a.correctRate - b.correctRate,
    )[0];
  }, [quizAnalytics.questionStats]);

  const easiest = useMemo(() => {
    if (!quizAnalytics.questionStats?.length) return null;
    return [...quizAnalytics.questionStats].sort(
      (a, b) => b.correctRate - a.correctRate,
    )[0];
  }, [quizAnalytics.questionStats]);

  const overallCorrectRate = useMemo(() => {
    const qs = quizAnalytics.questionStats || [];
    if (!qs.length) return 0;
    const correct = qs.reduce((sum, q) => sum + (q.correctCount || 0), 0);
    const answered = qs.reduce((sum, q) => sum + (q.totalAnswered || 0), 0);
    if (!answered) return 0;
    return Math.round((correct / answered) * 100);
  }, [quizAnalytics.questionStats]);

  const handleLeave = () => {
    dispatch(roomActions.resetGame());
    router.push("/dashboard");
  };

  const myCoins =
    myStats?.coinsEarned ?? final.coinsAwarded?.[currentUserId] ?? 0;
  const myPlacementCoins = myStats?.bonusBreakdown?.placement ?? 0;
  const myBonuses = myStats?.bonusBreakdown?.bonuses || [];
  const myBadges = myStats?.badgesEarned || [];
  const winnerInitial = (winner?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <main className="max-w-6xl px-6 py-10 mx-auto space-y-8">
          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute text-3xl top-4 left-8 animate-bounce">
                🎉
              </div>
              <div className="absolute text-2xl top-8 right-20 animate-pulse">
                ✨
              </div>
              <div className="absolute text-2xl bottom-6 left-24 animate-bounce">
                🎊
              </div>
              <div className="absolute text-3xl bottom-8 right-8 animate-pulse">
                🏆
              </div>
            </div>
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="text-[var(--gold)]" size={30} />
                  <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] font-display">
                    Winner Announcement
                  </h1>
                </div>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {winner?.name || "Unknown"} wins with {winner?.score || 0}{" "}
                  points!
                </p>
                <p className="text-[var(--text-secondary)] mt-2 font-bold">
                  Coins earned:{" "}
                  <span className="mono text-[var(--gold)]">
                    +{final.coinsAwarded?.[winner?.userId] || 0}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-muted)] text-[var(--accent-primary)] flex items-center justify-center text-2xl font-black mono">
                  {winnerInitial}
                </div>
                <div className="w-24 h-24 rounded-3xl bg-[var(--gold)]/20 border border-[var(--gold)]/40 flex items-center justify-center">
                  <Trophy className="text-[var(--gold)]" size={48} />
                </div>
              </div>
            </div>
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6">
              Your Performance
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Score</span>
                <span className="font-black mono">
                  {myScore} / {totalQuestions * 150}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Correct</span>
                <span className="font-black mono">
                  {myStats?.correct || 0} / {totalQuestions} ({myCorrectRate}%)
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Wrong</span>
                <span className="font-black mono">
                  {myStats?.wrong || 0} / {totalQuestions}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Avg Answer Time</span>
                <span className="font-black mono">
                  {myStats?.avgTime || 0}s
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Fastest Answer</span>
                <span className="font-black mono">
                  {myStats?.fastestTime || 0}s
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Slowest Answer</span>
                <span className="font-black mono">
                  {myStats?.slowestTime || 0}s
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Best Streak</span>
                <span className="font-black mono">
                  {myStats?.longestStreak || 0} correct in row
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between">
                <span>Coins Earned</span>
                <span className="mono font-black text-[var(--gold)]">
                  +{myCoins}
                </span>
              </div>
            </div>
            <p className="mt-4 text-[var(--text-secondary)] font-bold">
              {myPlacementCoins} placement +{" "}
              {myBonuses.reduce((s, b) => s + (b.amount || 0), 0)} bonus
            </p>
            {!!myBadges.length && (
              <div className="flex flex-wrap gap-2 mt-4">
                {myBadges.map((badge) => (
                  <span
                    key={badge.id}
                    className="px-3 py-1 rounded-full bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/30 text-xs font-black uppercase tracking-wider animate-pulse"
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setExpandedQuestions((v) => !v)}
            >
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Question-by-Question Breakdown
              </h2>
              {expandedQuestions ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedQuestions && (
              <div className="mt-5 space-y-3">
                {(myStats?.answers || []).map((a) => (
                  <div
                    key={a.questionIndex}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold text-[var(--text-primary)]">
                        Q{a.questionIndex + 1}. {a.questionText}
                      </p>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-black ${a.isCorrect ? "text-[var(--success)]" : "text-[var(--error)]"}`}
                        >
                          {a.isCorrect ? "Correct" : "Wrong"}
                        </span>
                        <span className="font-black mono">
                          +{a.pointsEarned} pts
                        </span>
                        <span className="mono text-[var(--text-secondary)]">
                          ({a.timeTaken}s)
                        </span>
                      </div>
                    </div>
                    {!a.isCorrect && (
                      <div className="mt-2 text-sm text-[var(--text-secondary)]">
                        <p>Your answer: {a.selectedAnswer ?? "No answer"}</p>
                        <p>Correct answer: {a.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)] overflow-auto">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6">
              Head-to-Head Comparison
            </h2>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="text-left text-[var(--text-secondary)] uppercase text-[10px] tracking-widest border-b border-[var(--border)]">
                  <th className="py-3">Metric</th>
                  {finalLeaderboard.map((p) => (
                    <th key={p.userId} className="py-3">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 font-bold">Score</td>
                  {finalLeaderboard.map((p) => (
                    <td key={p.userId} className="py-3 mono">
                      {p.score}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 font-bold">Correct</td>
                  {finalLeaderboard.map((p) => (
                    <td key={p.userId} className="py-3 mono">
                      {resolveStatsForUser(playerStats, p.userId)?.correct || 0}
                      /{totalQuestions}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[var(--border)]">
                  <td className="py-3 font-bold">Avg Time</td>
                  {finalLeaderboard.map((p) => (
                    <td key={p.userId} className="py-3 mono">
                      {resolveStatsForUser(playerStats, p.userId)?.avgTime || 0}
                      s
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 font-bold">Rank</td>
                  {finalLeaderboard.map((p, idx) => (
                    <td key={p.userId} className="py-3">
                      {rankLabel(idx)} {rankBadge(idx)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4">
              Quiz Difficulty Analysis
            </h2>
            <p className="font-bold text-[var(--text-primary)] mb-4">
              Overall correct rate: {overallCorrectRate}%
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              Hardest question: Q{(hardest?.questionIndex ?? 0) + 1} (
              {hardest?.correctCount ?? 0}/{hardest?.totalAnswered ?? 0}{" "}
              correct)
            </p>
            <p className="text-[var(--text-secondary)] mb-6">
              Easiest question: Q{(easiest?.questionIndex ?? 0) + 1} (
              {easiest?.correctCount ?? 0}/{easiest?.totalAnswered ?? 0}{" "}
              correct)
            </p>

            <div className="space-y-3">
              {(quizAnalytics.questionStats || []).map((q) => (
                <div
                  key={q.questionIndex}
                  className="grid grid-cols-[50px_1fr_auto] gap-3 items-center"
                >
                  <span className="font-bold mono">Q{q.questionIndex + 1}</span>
                  <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full bg-[var(--accent-primary)]"
                      style={{ width: `${q.correctRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {q.correctCount}/{q.totalAnswered} ({q.correctRate}%)
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6">
              Final Leaderboard
            </h2>
            <div className="h-[280px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={finalLeaderboard}
                  margin={{ top: 10, right: 10, bottom: 10, left: -10 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "var(--text-secondary)",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {finalLeaderboard.map((entry, idx) => (
                      <Cell
                        key={entry.userId}
                        fill={
                          entry.userId === currentUserId
                            ? "var(--accent-primary)"
                            : idx === 0
                              ? "var(--gold)"
                              : "var(--bg-tertiary)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {finalLeaderboard.map((p, idx) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-black mono">{idx + 1}</span>
                    <span className="font-bold">{p.name}</span>
                    {p.isDisqualified && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--error)] bg-[var(--error-muted)] px-2 py-0.5 rounded border border-[var(--error)]/20">
                        DQ
                      </span>
                    )}
                  </div>
                  <span className="font-black mono">{p.score}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)]">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6">
              Coins and Progression
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] flex justify-between items-center">
                <span className="font-bold">Placement Coins</span>
                <span className="mono font-black text-[var(--gold)]">
                  +{myPlacementCoins}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] flex justify-between items-center">
                <span className="font-bold">Total Coins Earned</span>
                <span className="mono font-black text-[var(--gold)]">
                  +{myCoins}
                </span>
              </div>
            </div>

            {!!myBonuses.length && (
              <div className="mt-4 space-y-2">
                {myBonuses.map((b, idx) => (
                  <div
                    key={`${b.name}-${idx}`}
                    className="p-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success-muted)] flex justify-between"
                  >
                    <span className="font-bold text-[var(--success)]">
                      {b.name}
                    </span>
                    <span className="mono font-black text-[var(--success)]">
                      +{b.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!!myBadges.length && (
              <div className="flex flex-wrap gap-2 mt-5">
                {myBadges.map((badge) => (
                  <span
                    key={badge.id}
                    className="px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/40 text-[var(--gold)] text-xs font-black uppercase tracking-wide animate-pulse"
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-6 sm:flex-row">
              <button
                onClick={() => router.push(`/profile/${currentUserId}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase tracking-wider py-3 rounded-xl"
              >
                <User size={18} /> View Your Profile
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] font-black uppercase tracking-wider py-3 rounded-xl"
              >
                <Home size={18} /> Dashboard
              </button>
              <button
                onClick={() => router.push("/room/join")}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--success)] text-white font-black uppercase tracking-wider py-3 rounded-xl"
              >
                <ArrowRight size={18} /> Play Again
              </button>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
