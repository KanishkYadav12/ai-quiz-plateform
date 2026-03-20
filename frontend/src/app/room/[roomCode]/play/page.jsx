"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle, Trophy, Clock } from "lucide-react";
import AuthGuard from "@/components/layout/AuthGuard";
import { useSocket } from "@/hooks/socket/useSocket";
import { selectGame } from "@/redux/slices/room/roomSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";

function TimerRing({ timeLeft, total }) {
  const pct = timeLeft / total;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;
  const color =
    timeLeft <= 5 ? "#E94560" : timeLeft <= 10 ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute -rotate-90" width="96" height="96">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="#1A1A2E"
          strokeWidth="6"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }}
        />
      </svg>
      <span className={`text-3xl font-bold z-10`} style={{ color }}>
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
  }, [game.currentQuestion]);

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
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
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
      return "bg-[#0F3460]/40 border border-[#0F3460] text-white hover:border-[#E94560] hover:bg-[#E94560]/10 cursor-pointer";
    }
    const ar = game.answerResult;
    if (option === ar?.correctAnswer)
      return "bg-green-500/20 border border-green-500 text-green-300";
    if (option === selected && !ar?.isCorrect)
      return "bg-red-500/20 border border-red-500 text-red-300";
    return "bg-[#0F3460]/20 border border-[#0F3460]/50 text-gray-500";
  };

  const q = game.currentQuestion;
  if (!q)
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <p className="text-xl text-white">Waiting for game...</p>
      </div>
    );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
        {/* Top bar */}
        <div className="bg-[#0F3460]/50 border-b border-[#0F3460] px-4 py-3">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Question</span>
              <span className="text-lg font-bold text-white">
                {game.questionIndex + 1}
              </span>
              <span className="text-sm text-gray-500">
                / {game.totalQuestions}
              </span>
            </div>
            <TimerRing timeLeft={timeLeft} total={game.timePerQuestion || 30} />
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#E94560]" />
              <span className="font-bold text-white">
                {game.leaderboard?.find((p) => p.userId === currentUser?._id)
                  ?.score || 0}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="max-w-3xl mx-auto mt-2">
            <div className="h-1 bg-[#0F3460] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E94560] transition-all duration-1000"
                style={{
                  width: `${((game.questionIndex + 1) / game.totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex flex-col flex-1 w-full max-w-3xl px-4 py-10 mx-auto">
          <div className="bg-[#0F3460]/30 border border-[#0F3460] rounded-2xl p-8 mb-8 text-center">
            <p className="text-2xl font-semibold leading-relaxed text-white">
              {q.questionText}
            </p>
          </div>

          {/* Options */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {q.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`p-5 rounded-2xl text-left font-medium transition-all text-lg ${getOptionStyle(option)}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 mr-3 text-sm font-bold rounded-lg bg-white/10">
                  {["A", "B", "C", "D"][i]}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Answer feedback */}
          {answered && game.answerResult && (
            <div
              className={`mt-6 flex items-center justify-between p-4 rounded-2xl border ${
                game.answerResult.isCorrect
                  ? "bg-green-500/10 border-green-500/40"
                  : "bg-red-500/10 border-red-500/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {game.answerResult.isCorrect ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <XCircle size={20} className="text-red-400" />
                )}
                <span
                  className={`font-semibold ${game.answerResult.isCorrect ? "text-green-300" : "text-red-300"}`}
                >
                  {game.answerResult.isCorrect
                    ? "Correct!"
                    : `Wrong — ${game.answerResult.correctAnswer}`}
                </span>
              </div>
              {game.answerResult.isCorrect && (
                <span className="text-lg font-bold text-green-400">
                  +{game.answerResult.pointsEarned}
                </span>
              )}
            </div>
          )}

          {answered && !game.answerResult && (
            <div className="flex items-center justify-center gap-2 p-4 mt-6 text-gray-400 rounded-2xl bg-white/5">
              <Clock size={16} />
              <span>Waiting for next question...</span>
            </div>
          )}

          {/* Live leaderboard */}
          {game.leaderboard?.length > 0 && (
            <div className="mt-6 bg-[#0F3460]/20 border border-[#0F3460]/50 rounded-2xl p-4">
              <p className="mb-3 text-xs tracking-widest text-gray-400 uppercase">
                Live Standings
              </p>
              <div className="space-y-2">
                {game.leaderboard.slice(0, 3).map((p, i) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-sm text-gray-500">{i + 1}</span>
                      <span
                        className={`text-sm font-medium ${p.userId === currentUser?._id ? "text-[#E94560]" : "text-gray-300"}`}
                      >
                        {p.name} {p.userId === currentUser?._id && "(you)"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {p.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
