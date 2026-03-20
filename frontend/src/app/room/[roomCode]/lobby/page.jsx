"use client";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Copy,
  Users,
  CheckCircle,
  Clock,
  Play,
  Loader2,
  Wifi,
  WifiOff,
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
  const joined = useRef(false);

  const { isConnected, joinRoom, markReady, startGame, leaveRoom } =
    useSocket();

  // Join room once connected
  useEffect(() => {
    if (!isConnected || !currentUser || joined.current) return;
    joined.current = true;
    joinRoom(roomCode, currentUser._id, currentUser.name);
  }, [isConnected, currentUser]);

  // Navigate to play when game starts
  useEffect(() => {
    if (game.status === "active") {
      router.push(`/room/${roomCode}/play`);
    }
  }, [game.status]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  const isHost = game.players.find(
    (p) =>
      p.userId === currentUser?._id && p.userId === game.players[0]?.userId,
  );
  const myPlayer = game.players.find((p) => p.userId === currentUser?._id);
  const isActualHost = game.hostId === currentUser?._id;
  const nonHostPlayers = game.players.filter((_, idx) => idx !== 0);
  const allReady =
    nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
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
      <div className="min-h-screen bg-[#1A1A2E]">
        <Navbar />
        <main className="max-w-2xl px-4 py-10 mx-auto">
          {/* Connection status */}
          <div
            className={`flex items-center gap-2 text-sm mb-6 ${isConnected ? "text-green-400" : "text-yellow-400"}`}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? "Connected" : "Connecting..."}
          </div>

          {/* Room code */}
          <div className="bg-[#0F3460]/40 border border-[#0F3460] rounded-2xl p-8 text-center mb-6">
            <p className="mb-3 text-sm tracking-widest text-gray-400 uppercase">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-6xl font-bold tracking-widest text-white">
                {roomCode}
              </span>
              <button
                onClick={copyCode}
                className="p-3 rounded-xl bg-[#E94560]/20 border border-[#E94560]/40 text-[#E94560] hover:bg-[#E94560]/30 transition-all"
              >
                <Copy size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Share this code with your friends to join
            </p>
          </div>

          {/* Players list */}
          <div className="bg-[#0F3460]/30 border border-[#0F3460] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Users size={18} className="text-[#E94560]" />
              <h2 className="font-semibold text-white">
                Players ({game.players.length})
              </h2>
            </div>

            {game.players.length === 0 ? (
              <div className="py-8 text-center">
                <Loader2
                  size={24}
                  className="mx-auto mb-3 text-gray-500 animate-spin"
                />
                <p className="text-sm text-gray-500">
                  Waiting for players to join...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {game.players.map((player, idx) => (
                  <div
                    key={player.userId}
                    className="flex items-center justify-between bg-[#1A1A2E]/60 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E94560] flex items-center justify-center text-white font-bold text-sm">
                        {player.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-white">
                          {player.name}
                        </span>
                        {idx === 0 && (
                          <span className="ml-2 text-xs text-[#E94560] bg-[#E94560]/10 px-2 py-0.5 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                    </div>
                    {player.isReady ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <Clock size={18} className="text-gray-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Non-host: ready toggle */}
            {!isActualHost && (
              <button
                onClick={handleReady}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all ${
                  myPlayer?.isReady
                    ? "bg-green-500/20 border border-green-500 text-green-400"
                    : "bg-[#E94560] hover:bg-[#c73652] text-white"
                }`}
              >
                {myPlayer?.isReady ? (
                  <>
                    <CheckCircle size={18} /> Ready!
                  </>
                ) : (
                  "Click to Ready Up"
                )}
              </button>
            )}

            {/* Host: start game */}
            {isActualHost && (
              <button
                onClick={handleStart}
                disabled={!allReady}
                className="w-full flex items-center justify-center gap-2 bg-[#E94560] hover:bg-[#c73652] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all"
              >
                <Play size={18} />
                {allReady
                  ? "Start Game"
                  : `Waiting for players... (${game.players.filter((p) => p.isReady).length}/${game.players.length} ready)`}
              </button>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
