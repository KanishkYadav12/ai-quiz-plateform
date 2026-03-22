"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  BookOpen,
  Trash2,
  Play,
  Globe,
  Lock,
  Loader2,
  Brain,
  User,
  Target,
  BarChart3,
  TrendingUp,
  Sparkles,
  Trophy,
  Zap,
  Star,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import { useRoom } from "@/hooks/room/useRoom";
import { useSocket } from "@/hooks/socket/useSocket";

function PublicQuizCard({ quiz, onPlay }) {
  const diffStyles = {
    easy: "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]",
    medium:
      "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]",
    hard: "bg-[var(--error-muted)] text-[var(--error)] border-[var(--error)]",
  };

  return (
    <div className="card p-5 group flex flex-col h-full bg-[var(--bg-secondary)] border-[var(--border)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--text-primary)] text-lg truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {quiz.title}
          </h3>
          <p className="text-[var(--text-secondary)] text-xs mt-1 flex items-center gap-1 font-medium">
            <User size={12} className="text-[var(--text-disabled)]" />{" "}
            {quiz.createdBy?.name || "AI Master"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${diffStyles[quiz.difficulty]}`}
        >
          {quiz.difficulty}
        </span>
        <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
          {quiz.totalQuestions} Questions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <Play size={12} className="text-[var(--accent-primary)]" />{" "}
          {quiz.timesPlayed || 0}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
          <Target size={12} className="text-[var(--success)]" />{" "}
          {quiz.timesPlayed > 0
            ? Math.round(quiz.totalScoreSum / quiz.timesPlayed)
            : 0}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-6">
        <div className="flex items-center text-[var(--gold)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={12}
              fill={
                i <= Math.round(quiz.ratingInfo?.average || 0)
                  ? "currentColor"
                  : "none"
              }
              className={
                i <= Math.round(quiz.ratingInfo?.average || 0)
                  ? ""
                  : "text-[var(--border-strong)]"
              }
            />
          ))}
        </div>
        <span className="text-[10px] font-black text-[var(--text-disabled)] uppercase tracking-widest">
          ({quiz.ratingInfo?.count || 0})
        </span>
      </div>

      <button
        onClick={() => onPlay(quiz._id)}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
      >
        <Sparkles size={14} fill="currentColor" />
        Play Now
      </button>
    </div>
  );
}

function LiveRoomCard({ room, onJoin }) {
  const diffStyles = {
    easy: "text-[var(--success)] bg-[var(--success-muted)]",
    medium: "text-[var(--warning)] bg-[var(--warning-muted)]",
    hard: "text-[var(--error)] bg-[var(--error-muted)]",
  };
  const isWaiting = room.status === "waiting";

  return (
    <div className="card p-5 bg-[var(--bg-secondary)] border-[var(--border)] flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--text-primary)] truncate">
            {room.quizTitle || room.quizId?.title}
          </h3>
          <p className="text-[var(--text-secondary)] text-xs mt-1 font-medium">
            Host: {room.hostName || room.hostId?.name}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isWaiting ? "text-[var(--success)] bg-[var(--success-muted)]" : "text-[var(--error)] bg-[var(--error-muted)]"}`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${isWaiting ? "bg-[var(--success)]" : "bg-[var(--error)] live-dot"}`}
          />
          {room.status}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-transparent ${diffStyles[room.difficulty || room.quizId?.difficulty]}`}
        >
          {room.difficulty || room.quizId?.difficulty}
        </span>
        <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
          {room.playerCount || room.players?.length} players
        </span>
      </div>

      <div className="mt-auto">
        {isWaiting ? (
          <button
            onClick={() => onJoin(room.roomCode)}
            className="flex items-center justify-center w-full gap-2 py-2 btn-primary"
          >
            <Play size={14} fill="currentColor" />
            Join
          </button>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-disabled)] text-xs font-bold py-2 rounded-xl cursor-not-allowed border border-[var(--border)]"
          >
            In Progress
          </button>
        )}
      </div>
    </div>
  );
}

function QuizCard({ quiz, onDelete, onPlay, deleteLoading }) {
  const diffStyles = {
    easy: "bg-[var(--success-muted)] text-[var(--success)]",
    medium: "bg-[var(--warning-muted)] text-[var(--warning)]",
    hard: "bg-[var(--error-muted)] text-[var(--error)]",
  };
  return (
    <div className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)] group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--text-primary)] text-xl truncate group-hover:text-[var(--accent-primary)] transition-colors font-display">
            {quiz.title}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">
            {quiz.topic}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
            <TrendingUp size={12} className="text-[var(--accent-primary)]" />{" "}
            {quiz.timesPlayed || 0}
          </div>
          {quiz.isPublic ? (
            <Globe size={16} className="text-[var(--success)]" />
          ) : (
            <Lock size={16} className="text-[var(--text-disabled)]" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${diffStyles[quiz.difficulty]}`}
        >
          {quiz.difficulty}
        </span>
        <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full border border-[var(--border)]">
          {quiz.totalQuestions} questions
        </span>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
        <Link
          href={`/quiz/${quiz._id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-bold py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent-primary)] transition-all"
        >
          <BarChart3 size={16} className="text-[var(--accent-primary)]" />
          Analytics
        </Link>
        <button
          onClick={() => onPlay(quiz._id)}
          className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Play size={16} fill="currentColor" />
          Host
        </button>
        <button
          onClick={() => onDelete(quiz._id)}
          disabled={deleteLoading}
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error-muted)] hover:border-[var(--error)] transition-all disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    quizzes,
    publicQuizzes,
    listLoading,
    publicListLoading,
    deleteLoading,
    loadMyQuizzes,
    loadPublicQuizzes,
    removeQuiz,
  } = useQuiz();
  const {
    liveRooms,
    liveRoomsLoading,
    loadLiveRooms,
    makeRoom,
    createLoading,
  } = useRoom();
  const { isConnected, joinDashboard } = useSocket();

  useEffect(() => {
    loadMyQuizzes();
    loadPublicQuizzes();
    loadLiveRooms();
  }, []);

  useEffect(() => {
    if (isConnected) {
      joinDashboard();
    }
  }, [isConnected]);

  useEffect(() => {
    const id = setInterval(() => {
      loadLiveRooms();
    }, 10000);

    return () => clearInterval(id);
  }, [loadLiveRooms]);

  const handleJoinRoom = (roomCode) => {
    router.push(`/room/${roomCode}/lobby`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="px-4 py-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {createLoading && (
            <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
              <div className="card p-10 flex flex-col items-center gap-6 shadow-2xl border-[var(--border-strong)]">
                <Loader2
                  size={48}
                  className="animate-spin text-[var(--accent-primary)]"
                />
                <p className="font-bold text-[var(--text-primary)] text-lg">
                  Initializing Live Room...
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-6 mb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
                Welcome,{" "}
                <span className="text-[var(--accent-primary)]">
                  {user?.name?.split(" ")[0]}
                </span>
              </h1>
              <p className="text-[var(--text-secondary)] mt-2 font-medium">
                Ready to host your next competition?
              </p>
            </div>
            <Link
              href="/quiz/create"
              className="btn-primary flex items-center gap-2 px-8 py-4 text-base shadow-lg shadow-[var(--accent-primary)]/20"
            >
              <PlusCircle size={20} />
              Create New Quiz
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-4">
            {/* Left Main Content */}
            <div className="order-2 space-y-12 xl:order-1 xl:col-span-3">
              {/* Live Now Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-[var(--error)] rounded-full live-dot" />
                    Live Rooms
                  </h2>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full border border-[var(--border)]">
                    Real-time
                  </div>
                </div>

                {liveRoomsLoading ? (
                  <div className="flex items-center justify-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] border-dashed">
                    <Loader2
                      size={32}
                      className="animate-spin text-[var(--accent-primary)]"
                    />
                  </div>
                ) : liveRooms.length === 0 ? (
                  <div className="bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] rounded-2xl py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4 text-[var(--text-disabled)]">
                      <Zap size={24} />
                    </div>
                    <p className="text-[var(--text-primary)] font-bold">
                      No active rooms found
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      Be the first to host one!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {liveRooms.map((room) => (
                      <LiveRoomCard
                        key={room.roomCode}
                        room={room}
                        onJoin={handleJoinRoom}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* My Quizzes */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                    <BookOpen
                      size={24}
                      className="text-[var(--accent-primary)]"
                    />
                    My Quizzes
                  </h2>
                </div>

                {listLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2
                      size={32}
                      className="animate-spin text-[var(--accent-primary)]"
                    />
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="card bg-[var(--bg-secondary)] py-20 text-center border-dashed">
                    <div className="w-20 h-20 rounded-3xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-6 text-[var(--accent-primary)]">
                      <Brain size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                      No quizzes created
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-8 font-medium">
                      Use AI to generate a quiz on any topic in seconds.
                    </p>
                    <Link
                      href="/quiz/create"
                      className="inline-flex items-center gap-2 px-8 py-3 btn-primary"
                    >
                      <PlusCircle size={20} /> Create Your First Quiz
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {quizzes.map((quiz) => (
                      <QuizCard
                        key={quiz._id}
                        quiz={quiz}
                        onDelete={removeQuiz}
                        onPlay={(id) => makeRoom({ quizId: id })}
                        deleteLoading={deleteLoading}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar — Stats & Public Library */}
            <div className="order-1 space-y-10 xl:order-2 xl:col-span-1">
              {/* Profile Stats */}
              <div className="card p-6 bg-[var(--accent-primary)] border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 transition-transform opacity-10 group-hover:scale-110">
                  <Trophy size={80} className="text-white" />
                </div>
                <h3 className="text-white/80 font-bold uppercase tracking-wider text-[10px] mb-6">
                  Global Ranking
                </h3>
                <div className="mb-2 text-4xl font-black text-white font-display">
                  {user?.totalCoins || 0}{" "}
                  <span className="text-lg font-bold text-white/60">Coins</span>
                </div>
                <div className="flex gap-4 mt-8">
                  <div className="flex-1 p-3 bg-white/10 backdrop-blur-md rounded-xl">
                    <div className="text-lg font-black text-white">
                      {quizzes.length}
                    </div>
                    <div className="text-white/60 text-[10px] font-bold uppercase">
                      Quizzes
                    </div>
                  </div>
                  <div className="flex-1 p-3 bg-white/10 backdrop-blur-md rounded-xl">
                    <div className="text-lg font-black text-white">
                      {quizzes.filter((q) => q.isPublic).length}
                    </div>
                    <div className="text-white/60 text-[10px] font-bold uppercase">
                      Public
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Library Sidebar */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Globe size={20} className="text-[var(--accent-primary)]" />
                    Public Library
                  </h3>
                </div>

                {publicListLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2
                      size={24}
                      className="animate-spin text-[var(--accent-primary)]"
                    />
                  </div>
                ) : publicQuizzes.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-sm italic py-4">
                    No public quizzes found.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {publicQuizzes.slice(0, 5).map((quiz) => (
                      <PublicQuizCard
                        key={quiz._id}
                        quiz={quiz}
                        onPlay={(id) => makeRoom({ quizId: id })}
                      />
                    ))}
                    {publicQuizzes.length > 5 && (
                      <button className="text-sm font-bold text-[var(--accent-primary)] hover:underline py-2 text-center">
                        Browse all public quizzes
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
