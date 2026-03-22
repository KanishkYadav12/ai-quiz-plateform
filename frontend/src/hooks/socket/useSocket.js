"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { roomActions } from "@/redux/slices/room/roomSlice";

const PROD_BACKEND = "https://ai-quiz-plateform.onrender.com";

const resolveSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    if (isLocalHost) return "http://localhost:8000";
  }

  return PROD_BACKEND;
};

export const useSocket = () => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socketRef.current) return;

    socketRef.current = io(resolveSocketUrl(), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const s = socketRef.current;

    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));

    // ── bind all server → client events to Redux ──────────
    s.on("room_joined", (payload) =>
      dispatch(roomActions.setRoomJoined(payload)),
    );
    s.on("player_joined", (payload) =>
      dispatch(roomActions.playerJoined(payload)),
    );
    s.on("player_left", (payload) => dispatch(roomActions.playerLeft(payload)));
    s.on("player_ready", (payload) =>
      dispatch(roomActions.playerReadyUpdated(payload)),
    );
    s.on("game_started", (payload) =>
      dispatch(roomActions.gameStarted(payload)),
    );
    s.on("question_update", (payload) =>
      dispatch(roomActions.questionUpdated(payload)),
    );
    s.on("answer_result", (payload) =>
      dispatch(roomActions.answerResultReceived(payload)),
    );
    s.on("leaderboard_update", (payload) =>
      dispatch(roomActions.leaderboardUpdated(payload)),
    );
    s.on("player_finished", (payload) =>
      dispatch(roomActions.playerFinished(payload)),
    );
    s.on("game_over", (payload) => dispatch(roomActions.gameOver(payload)));
    s.on("room_status_update", (payload) =>
      dispatch(roomActions.updateLiveRoom(payload)),
    );
    s.on("player_disqualified", (payload) =>
      dispatch(roomActions.playerDisqualified(payload)),
    );
    s.on("host_changed", (payload) =>
      dispatch(roomActions.hostChanged(payload)),
    );
    s.on("error", (payload) => {
      dispatch(roomActions.socketError(payload));

      // If server room state was lost (e.g. restart), return user to dashboard.
      if (
        typeof window !== "undefined" &&
        payload?.message?.toLowerCase().includes("room not found")
      ) {
        window.location.href = "/dashboard";
      }
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  // ── emit helpers ──────────────────────────────────────────
  const emit = (event, payload) => {
    socketRef.current?.emit(event, payload);
  };

  const joinDashboard = () => emit("join_dashboard", {});
  const joinRoom = (roomCode, userId, userName) =>
    emit("join_room", { roomCode, userId, userName });
  const markReady = (roomCode, userId, isReady) =>
    emit("player_ready", { roomCode, userId, isReady });
  const startGame = (roomCode) => emit("start_game", { roomCode });
  const submitAnswer = (payload) => emit("submit_answer", payload);
  const leaveRoom = (roomCode, userId) =>
    emit("leave_room", { roomCode, userId });
  const disqualifyPlayer = (payload) => emit("disqualify_player", payload);

  return {
    socket: socketRef.current,
    isConnected,
    joinDashboard,
    joinRoom,
    markReady,
    startGame,
    submitAnswer,
    leaveRoom,
    disqualifyPlayer,
  };
};
