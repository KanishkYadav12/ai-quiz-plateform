"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Copy,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Loader2,
  Wifi,
  WifiOff,
  Share2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { useSocket } from "@/hooks/socket/useSocket";
import { selectGame } from "@/redux/slices/room/roomSlice";
import { selectCurrentUser } from "@/redux/slices/auth/authSlice";

export default function LobbyPage() {
  const { roomCode } = useParams();
  const router = useRouter();
  const currentUser = useSelector(selectCurrentUser);
  const game = useSelector(selectGame);

  const { isConnected, joinRoom, markReady, startGame, leaveRoom } =
    useSocket();

  useEffect(() => {
    if (!isConnected || !currentUser) return;
    joinRoom(roomCode, currentUser._id, currentUser.name);
  }, [isConnected, currentUser, roomCode, joinRoom]);

  useEffect(() => {
    if (game.status === "active") {
      router.push(`/room/${roomCode}/play`);
    }
  }, [game.status, roomCode, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  const myPlayer = game.players.find((p) => p.userId === currentUser?._id);
  const isActualHost = game.hostId === currentUser?._id;
  const nonHostPlayers = game.players.filter((p) => p.userId !== game.hostId);
  const allReady =
    nonHostPlayers.length === 0 || nonHostPlayers.every((p) => p.isReady);

  const handleReady = () => {
    markReady(roomCode, currentUser._id, !myPlayer?.isReady);
  };

  const handleStart = () => {
    if (!allReady) {
      toast.error("Wait for all players to be ready!");
      return;
    }
    startGame(roomCode);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-4xl px-6 py-12 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left Column: Room Code & Status */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-8 bg-[var(--bg-secondary)] border-[var(--border)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Share2 size={120} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-disabled)] mb-4">
                  Join Code
                </p>
                <div className="flex flex-col items-center gap-6 relative z-10">
                  <span className="text-7xl font-black tracking-[0.1em] text-[var(--text-primary)] font-display mono">
                    {roomCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all font-bold text-sm"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>
              </div>

              <div className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">
                    Server Status
                  </span>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isConnected ? "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]" : "bg-[var(--error-muted)] text-[var(--error)] border-[var(--error)]"}`}
                  >
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {isConnected ? "Live" : "Offline"}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
                    <CheckCircle2 size={16} className="text-[var(--success)]" />
                    Smooth Play Mode
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
                    <UserCheck
                      size={16}
                      className="text-[var(--accent-primary)]"
                    />
                    Private Room
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Player List & Action */}
            <div className="lg:col-span-3 space-y-6">
              <div className="card bg-[var(--bg-secondary)] border-[var(--border)] flex flex-col h-full min-h-[400px]">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent-primary)]">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-[var(--text-primary)]">
                        Lobby Participants
                      </h2>
                      <p className="text-[10px] font-black text-[var(--text-disabled)] uppercase tracking-wider">
                        {game.players.length} Players connected
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                  {game.players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-disabled)]">
                      <Loader2 size={32} className="animate-spin mb-4" />
                      <p className="font-bold uppercase tracking-widest text-xs">
                        Waiting for participants...
                      </p>
                    </div>
                  ) : (
                    game.players.map((player) => (
                      <div
                        key={player.userId}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${player.isReady ? "bg-[var(--bg-primary)] border-[var(--success)]/30" : "bg-[var(--bg-tertiary)] border-[var(--border)]"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-black text-lg">
                            {player.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text-primary)]">
                                {player.name}
                              </span>
                              {player.userId === game.hostId && (
                                <span className="text-[8px] font-black text-[var(--accent-primary)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--accent-primary)]/10">
                                  Host
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest">
                              {player.userId === currentUser?._id
                                ? "You"
                                : "Participant"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {player.userId !== game.hostId ? (
                            player.isReady ? (
                              <div className="flex items-center gap-2 text-[var(--success)] font-black text-[10px] uppercase tracking-widest bg-[var(--success-muted)] px-3 py-1.5 rounded-lg border border-[var(--success)]/20">
                                <CheckCircle2 size={14} /> Ready
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[var(--text-disabled)] font-black text-[10px] uppercase tracking-widest bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                                <Clock size={14} /> Waiting
                              </div>
                            )
                          ) : (
                            <div className="text-[10px] font-black text-[var(--text-disabled)] uppercase tracking-[0.2em]">
                              Hosting
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-[var(--border)]">
                  {/* Action Button */}
                  {!isActualHost ? (
                    <button
                      onClick={handleReady}
                      className={`w-full flex items-center justify-center gap-3 font-black uppercase tracking-widest py-4 rounded-2xl transition-all border-2 ${
                        myPlayer?.isReady
                          ? "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white"
                          : "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent-primary)]/20"
                      }`}
                    >
                      {myPlayer?.isReady ? (
                        <>
                          <CheckCircle2 size={20} /> I am Ready!
                        </>
                      ) : (
                        "Ready Up"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleStart}
                      disabled={!allReady}
                      className="w-full flex items-center justify-center gap-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                    >
                      <Play size={20} fill="currentColor" />
                      {allReady
                        ? "Start Competition"
                        : `Waiting for Players (${game.players.filter((p) => p.isReady).length}/${game.players.length - 1} Ready)`}
                    </button>
                  )}
                  {isActualHost && !allReady && game.players.length > 1 && (
                    <p className="text-center text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest mt-4">
                      All participants must mark ready to begin
                    </p>
                  )}
                  {isActualHost && game.players.length <= 1 && (
                    <p className="text-center text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-widest mt-4">
                      Invite players to join the competition
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
