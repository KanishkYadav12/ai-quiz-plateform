"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { CheckCircle2, XCircle, Trophy, Clock, AlertTriangle, ChevronRight, Hash, Loader2 } from "lucide-react";
import AuthGuard from "@/components/layout/AuthGuard";
import { useSocket } from "@/hooks/socket/useSocket";
import { selectGame } from "@/redux/slices/room/roomSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";

function TimerRing({ timeLeft, total }) {
  const pct = timeLeft / total;
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;

  let color = "var(--success)";
  if (timeLeft <= 5) color = "var(--error)";
  else if (timeLeft <= 10) color = "var(--warning)";

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute -rotate-90" width="80" height="80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s", filter: timeLeft <= 5 ? "drop-shadow(0 0 4px var(--error))" : "none" }}
          className={timeLeft <= 5 ? "animate-pulse" : ""}
        />
      </svg>
      <span className="text-2xl font-black z-10 mono" style={{ color }}>
        {timeLeft}
      </span>
    </div>
  );
}

export default function GamePlayPage() {
  const { roomCode } = useParams();
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const game = useSelector(selectGame);
  const { isConnected, joinRoom, submitAnswer } = useSocket();
  const [timeLeft, setTimeLeft] = useState(game.timePerQuestion || 30);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Reset on new question
  useEffect(() => {
    if (!game.currentQuestion) return;
    setSelected(null);
    setAnswered(false);
    setTimeLeft(game.timePerQuestion || 30);
    setStartTime(Date.now());
  }, [game.currentQuestion, game.questionIndex]);

  const joined = useRef(false);

  useEffect(() => {
    if (!isConnected || !currentUser || joined.current) return;
    joined.current = true;
    joinRoom(roomCode, currentUser._id, currentUser.name);
  }, [isConnected, currentUser]);

  // Countdown timer
  useEffect(() => {
    if (answered) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, answered]);

  // Navigate to results when game over
  useEffect(() => {
    if (game.status === "completed") {
      router.push(`/room/${roomCode}/results`);
    }
  }, [game.status]);

  const handleAnswer = useCallback(
    (option) => {
      if (answered) return;
      setSelected(option);
      setAnswered(true);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      submitAnswer({
        roomCode,
        userId: currentUser._id,
        questionIndex: game.questionIndex,
        selectedAnswer: option,
        timeTaken,
      });
    },
    [answered, startTime, game.questionIndex],
  );

  const getOptionStyle = (option) => {
    if (!answered) {
      return "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-muted)] cursor-pointer group";
    }
    const ar = game.answerResult;
    if (option === ar?.correctAnswer)
      return "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)] shadow-[0_0_15px_rgba(63,185,80,0.15)]";
    if (option === selected && !ar?.isCorrect)
      return "bg-[var(--error-muted)] border-[var(--error)] text-[var(--error)]";
    return "bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-disabled)] opacity-50";
  };

  const q = game.currentQuestion;
  if (!q)
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center page-enter">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
          <p className="text-xl font-bold text-[var(--text-primary)]">Syncing with room...</p>
        </div>
      </div>
    );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col page-enter">
        {/* Top bar */}
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Room Code</span>
                <span className="mono font-bold text-[var(--accent-primary)]">{roomCode}</span>
              </div>
              <div className="h-8 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-[var(--text-primary)] font-display">
                  {game.questionIndex + 1}
                </span>
                <span className="text-sm font-bold text-[var(--text-secondary)]">
                  / {game.totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <TimerRing timeLeft={timeLeft} total={game.timePerQuestion || 30} />

              <div className="hidden sm:flex flex-col items-end">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Your Score</span>
                 <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-[var(--gold)]" />
                    <span className="text-xl font-black text-[var(--text-primary)] mono">
                      {game.leaderboard?.find((p) => p.userId === currentUser?._id)?.score || 0}
                    </span>
                 </div>
              </div>
            </div>
          </div>

          {/* Global Progress */}
          <div className="max-w-4xl mx-auto mt-4 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-1000 shadow-[0_0_10px_rgba(88,166,255,0.5)]"
              style={{
                width: `${((game.questionIndex + 1) / game.totalQuestions) * 100}%`,
              }}
            />
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl px-6 py-12 mx-auto">
          {/* Question card */}
          <div className="card p-10 mb-10 text-center bg-[var(--bg-secondary)] border-[var(--border)] shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent-primary)] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
              Question {game.questionIndex + 1}
            </div>
            <p className="text-3xl font-bold leading-tight text-[var(--text-primary)] font-display">
              {q.questionText}
            </p>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {q.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`p-6 rounded-2xl text-left font-bold transition-all text-xl border-2 flex items-center gap-4 ${getOptionStyle(option)}`}
              >
                <span className="w-10 h-10 flex items-center justify-center text-sm font-black rounded-xl bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-primary)] transition-colors shrink-0 mono">
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="flex-1">{option}</span>
                {answered && option === game.answerResult?.correctAnswer && <CheckCircle2 size={24} className="text-[var(--success)]" />}
                {answered && option === selected && !game.answerResult?.isCorrect && <XCircle size={24} className="text-[var(--error)]" />}
              </button>
            ))}
          </div>

          {/* Instant feedback footer */}
          <div className="h-32 mt-10">
            {answered && game.answerResult && (
              <div
                className={`p-6 rounded-2xl border-2 flex items-center justify-between animate-[fadeSlideUp_0.3s_ease] ${
                  game.answerResult.isCorrect
                    ? "bg-[var(--success-muted)] border-[var(--success)]"
                    : "bg-[var(--error-muted)] border-[var(--error)]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${game.answerResult.isCorrect ? "bg-[var(--success)] text-white" : "bg-[var(--error)] text-white"}`}>
                    {game.answerResult.isCorrect ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black ${game.answerResult.isCorrect ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                      {game.answerResult.isCorrect ? "Brilliant!" : "Not quite!"}
                    </h4>
                    {!game.answerResult.isCorrect && (
                      <p className="text-[var(--text-secondary)] font-bold">The answer was: {game.answerResult.correctAnswer}</p>
                    )}
                  </div>
                </div>
                {game.answerResult.isCorrect && (
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-[var(--success)] uppercase tracking-widest">Points Earned</span>
                    <span className="text-3xl font-black text-[var(--success)] mono">+{game.answerResult.pointsEarned}</span>
                  </div>
                )}
              </div>
            )}

            {answered && !game.answerResult && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-[var(--text-secondary)] rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] border-dashed border-2">
                <Clock size={32} className="animate-pulse" />
                <span className="font-bold uppercase tracking-widest text-xs">Waiting for other players...</span>
              </div>
            )}
          </div>

          {/* Live Leaderboard Overlay */}
          {game.leaderboard?.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                  <Trophy size={16} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">Live Standings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {game.leaderboard.slice(0, 3).map((p, i) => (
                  <div
                    key={p.userId}
                    className={`card p-4 flex items-center gap-4 bg-[var(--bg-secondary)] border-[var(--border)] ${p.userId === currentUser?._id ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center font-black text-[var(--text-secondary)] shrink-0 mono">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${p.userId === currentUser?._id ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>
                        {p.name}
                      </p>
                      <p className="text-[10px] font-black text-[var(--text-disabled)] uppercase mono">{p.score} PTS</p>
                    </div>
                    {p.userId === currentUser?._id && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
