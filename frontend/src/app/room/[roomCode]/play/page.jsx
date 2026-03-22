"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import AuthGuard from "@/components/layout/AuthGuard";
import { useSocket } from "@/hooks/socket/useSocket";
import { selectGame } from "@/redux/slices/room/roomSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";

function TimerRing({ timeLeft, total }) {
  const safeTotal = Math.max(total || 1, 1);
  const pct = Math.max(Math.min(timeLeft / safeTotal, 1), 0);
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
          style={{
            transition: "stroke-dasharray 1s linear, stroke 0.5s",
            filter:
              timeLeft <= 5 ? "drop-shadow(0 0 4px var(--error))" : "none",
          }}
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
  const currentUserId = currentUser?._id;
  const game = useSelector(selectGame);
  const { isConnected, joinRoom, submitAnswer } = useSocket();

  const [timeLeft, setTimeLeft] = useState(game.timePerQuestion || 30);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const joined = useRef(false);
  const autoSubmittedRef = useRef(false);

  const myLeaderboardEntry = useMemo(
    () => game.leaderboard?.find((p) => p.userId === currentUserId),
    [game.leaderboard, currentUserId],
  );

  const meFinished = useMemo(() => {
    if (!currentUserId) return false;
    return game.finishedPlayers?.some((p) => p.userId === currentUserId);
  }, [game.finishedPlayers, currentUserId]);

  useEffect(() => {
    if (!isConnected || !currentUser || joined.current) return;
    joined.current = true;
    joinRoom(roomCode, currentUser._id, currentUser.name);
  }, [isConnected, currentUser, roomCode, joinRoom]);

  useEffect(() => {
    const sameRoom = game.roomCode?.toString() === roomCode?.toString();
    if (game.status === "completed" && sameRoom) {
      router.push(`/room/${roomCode}/results`);
    }
  }, [game.status, game.roomCode, roomCode, router]);

  useEffect(() => {
    if (!game.currentQuestion || meFinished) return;
    setSelected(null);
    setAnswered(false);
    setTimeLeft(game.timePerQuestion || 30);
    setStartTime(Date.now());
    autoSubmittedRef.current = false;
  }, [
    game.currentQuestion,
    game.questionIndex,
    game.timePerQuestion,
    meFinished,
  ]);

  const submitCurrentAnswer = useCallback(
    (option) => {
      if (!currentUserId || !game.currentQuestion || meFinished) return;
      if (answered) return;

      setSelected(option);
      setAnswered(true);

      const elapsed = startTime
        ? Math.round((Date.now() - startTime) / 1000)
        : 0;
      const timeTaken = Math.max(
        1,
        Math.min(
          elapsed || game.timePerQuestion || 30,
          game.timePerQuestion || 30,
        ),
      );

      submitAnswer({
        roomCode,
        userId: currentUserId,
        questionIndex: game.questionIndex,
        selectedAnswer: option,
        timeTaken,
      });
    },
    [
      currentUserId,
      game.currentQuestion,
      meFinished,
      answered,
      startTime,
      game.timePerQuestion,
      roomCode,
      game.questionIndex,
      submitAnswer,
    ],
  );

  useEffect(() => {
    if (!game.currentQuestion || answered || meFinished) return;
    if (timeLeft > 0) {
      const t = setInterval(
        () => setTimeLeft((tVal) => (tVal > 0 ? tVal - 1 : 0)),
        1000,
      );
      return () => clearInterval(t);
    }

    if (!autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitCurrentAnswer(null);
    }
  }, [
    timeLeft,
    answered,
    meFinished,
    game.currentQuestion,
    submitCurrentAnswer,
  ]);

  useEffect(() => {
    if (!game.answerResult) return;
    if (game.answerResult.questionIndex !== game.questionIndex) return;
    setAnswered(true);
  }, [game.answerResult, game.questionIndex]);

  const getOptionStyle = (option) => {
    if (!answered) {
      return "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-muted)] cursor-pointer group";
    }
    const ar = game.answerResult;
    if (option === ar?.correctAnswer) {
      return "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)] shadow-[0_0_15px_rgba(63,185,80,0.15)]";
    }
    if (option === selected && !ar?.isCorrect) {
      return "bg-[var(--error-muted)] border-[var(--error)] text-[var(--error)]";
    }
    return "bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-disabled)] opacity-50";
  };

  const finishedCount = game.finishedPlayers?.length || 0;
  const totalPlayers = game.players?.length || 0;

  if (meFinished && game.status === "active") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col page-enter">
          <main className="w-full max-w-4xl mx-auto px-6 py-12">
            <div className="card p-8 bg-[var(--success-muted)] border-[var(--success)] mb-8">
              <h1 className="text-3xl font-black text-[var(--success)] mb-2 font-display">
                You finished! Waiting for other players...
              </h1>
              <p className="text-[var(--text-secondary)] font-bold">
                Progress: {finishedCount}/{totalPlayers} players finished
              </p>
              <div className="mt-4 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full bg-[var(--success)] transition-all duration-700"
                  style={{
                    width: `${totalPlayers > 0 ? (finishedCount / totalPlayers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)]">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-5">
                Live Player Status
              </h2>
              <div className="space-y-3">
                {(game.players || []).map((p) => {
                  const lb = game.leaderboard?.find(
                    (x) => x.userId === p.userId,
                  );
                  return (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-[var(--text-primary)] truncate">
                          {p.name}
                        </span>
                        {p.finished ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--success)] bg-[var(--success-muted)] px-2 py-1 rounded">
                            Finished
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--warning)] bg-[var(--warning-muted)] px-2 py-1 rounded animate-pulse">
                            Still Playing
                          </span>
                        )}
                      </div>
                      <div className="mono text-lg font-black text-[var(--text-primary)]">
                        {lb?.score || p.score || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const q = game.currentQuestion;
  if (!q) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center page-enter">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              size={40}
              className="animate-spin text-[var(--accent-primary)]"
            />
            <p className="text-xl font-bold text-[var(--text-primary)]">
              Syncing with room...
            </p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col page-enter">
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">
                  Room Code
                </span>
                <span className="mono font-bold text-[var(--accent-primary)]">
                  {roomCode}
                </span>
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
              <TimerRing
                timeLeft={timeLeft}
                total={game.timePerQuestion || 30}
              />

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">
                  Your Score
                </span>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[var(--gold)]" />
                  <span className="text-xl font-black text-[var(--text-primary)] mono">
                    {myLeaderboardEntry?.score || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-4 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-700 shadow-[0_0_10px_rgba(88,166,255,0.5)]"
              style={{
                width: `${game.totalQuestions > 0 ? ((game.questionIndex + 1) / game.totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl px-6 py-12 mx-auto">
          <div className="card p-10 mb-10 text-center bg-[var(--bg-secondary)] border-[var(--border)] shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent-primary)] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
              Question {game.questionIndex + 1}
            </div>
            <p className="text-3xl font-bold leading-tight text-[var(--text-primary)] font-display">
              {q.questionText}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {q.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => submitCurrentAnswer(option)}
                disabled={answered}
                className={`p-6 rounded-2xl text-left font-bold transition-all text-xl border-2 flex items-center gap-4 ${getOptionStyle(option)}`}
              >
                <span className="w-10 h-10 flex items-center justify-center text-sm font-black rounded-xl bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-primary)] transition-colors shrink-0 mono">
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="flex-1">{option}</span>
                {answered && option === game.answerResult?.correctAnswer && (
                  <CheckCircle2 size={24} className="text-[var(--success)]" />
                )}
                {answered &&
                  option === selected &&
                  !game.answerResult?.isCorrect && (
                    <XCircle size={24} className="text-[var(--error)]" />
                  )}
              </button>
            ))}
          </div>

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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      game.answerResult.isCorrect
                        ? "bg-[var(--success)] text-white"
                        : "bg-[var(--error)] text-white"
                    }`}
                  >
                    {game.answerResult.isCorrect ? (
                      <CheckCircle2 size={28} />
                    ) : (
                      <AlertTriangle size={28} />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-xl font-black ${
                        game.answerResult.isCorrect
                          ? "text-[var(--success)]"
                          : "text-[var(--error)]"
                      }`}
                    >
                      {game.answerResult.timedOut
                        ? "Time up"
                        : game.answerResult.isCorrect
                          ? "Correct"
                          : "Wrong"}
                    </h4>
                    <p className="text-[var(--text-secondary)] font-bold">
                      Correct answer: {game.answerResult.correctAnswer}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    Points
                  </span>
                  <span className="text-3xl font-black mono text-[var(--text-primary)]">
                    +{game.answerResult.pointsEarned}
                  </span>
                </div>
              </div>
            )}

            {answered && !game.answerResult && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-[var(--text-secondary)] rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] border-dashed border-2">
                <Clock size={32} className="animate-pulse" />
                <span className="font-bold uppercase tracking-widest text-xs">
                  Scoring your answer...
                </span>
              </div>
            )}
          </div>

          {game.leaderboard?.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                  <Trophy size={16} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Live Standings
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {game.leaderboard.slice(0, 3).map((p, i) => (
                  <div
                    key={p.userId}
                    className={`card p-4 flex items-center gap-4 bg-[var(--bg-secondary)] border-[var(--border)] ${
                      p.userId === currentUserId
                        ? "border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20"
                        : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center font-black text-[var(--text-secondary)] shrink-0 mono">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold truncate ${
                          p.userId === currentUserId
                            ? "text-[var(--accent-primary)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black text-[var(--text-disabled)] uppercase mono">
                          {p.score} PTS
                        </p>
                        {p.isDisqualified && (
                          <span className="text-[8px] font-black text-[var(--error)] bg-[var(--error-muted)] px-1.5 py-0.5 rounded uppercase tracking-tighter border border-[var(--error)]/20">
                            DQ
                          </span>
                        )}
                      </div>
                    </div>
                    {p.userId === currentUserId && (
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    )}
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
