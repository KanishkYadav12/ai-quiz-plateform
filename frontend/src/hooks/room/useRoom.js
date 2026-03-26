"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createRoom,
  activateRoom,
  fetchRoomByCode,
  fetchMyRooms,
  fetchRoomHistory,
  fetchLiveRooms,
} from "@/redux/actions/room/roomAction";
import {
  selectRoomCreate,
  selectRoomActivate,
  selectRoomDetails,
  selectMyRooms,
  selectRoomHistory,
  selectLiveRooms,
  selectGame,
  roomActions,
} from "@/redux/slices/room/roomSlice";

export const useRoom = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const createOp = useSelector(selectRoomCreate);
  const activateOp = useSelector(selectRoomActivate);
  const detailsOp = useSelector(selectRoomDetails);
  const myRoomsOp = useSelector(selectMyRooms);
  const historyOp = useSelector(selectRoomHistory);
  const liveRoomsOp = useSelector(selectLiveRooms);
  const game = useSelector(selectGame);

  const [createLoading, setCreateLoading] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);

  // ── create room effect ────────────────────────────────────
  useEffect(() => {
    if (createOp.status === "pending") setCreateLoading(true);
    if (createOp.status === "success") {
      setCreateLoading(false);
      const roomCode = createOp.data?.roomCode;
      toast.success(`Room created! Code: ${roomCode}`);
      dispatch(roomActions.clearCreate());
      if (roomCode) router.push(`/room/${roomCode}/lobby`);
    }
    if (createOp.status === "failed") {
      setCreateLoading(false);
      toast.error(createOp.error || "Failed to create room");
      dispatch(roomActions.clearCreate());
    }
  }, [createOp.status]);

  // ── activate room effect ───────────────────────────────
  useEffect(() => {
    if (activateOp.status === "pending") setActivateLoading(true);
    if (activateOp.status === "success") {
      setActivateLoading(false);
      const roomCode = activateOp.data?.roomCode;
      toast.success("Room activated");
      dispatch(roomActions.clearActivate());
      if (roomCode) router.push(`/room/${roomCode}/lobby`);
    }
    if (activateOp.status === "failed") {
      setActivateLoading(false);
      toast.error(activateOp.error || "Failed to activate room");
      dispatch(roomActions.clearActivate());
    }
  }, [activateOp.status]);

  return {
    // state
    room: detailsOp.data || null,
    myRooms: myRoomsOp.data || [],
    history: historyOp.data || [],
    liveRooms: liveRoomsOp.data || [],
    game,
    createLoading,
    activateLoading,
    detailLoading: detailsOp.status === "pending",
    myRoomsLoading: myRoomsOp.status === "pending",
    historyLoading: historyOp.status === "pending",
    liveRoomsLoading: liveRoomsOp.status === "pending",
    detailError: detailsOp.error,

    // actions
    makeRoom: (payload) => dispatch(createRoom(payload)),
    activateRoom: (roomCode) => dispatch(activateRoom(roomCode)),
    loadRoom: (roomCode) => dispatch(fetchRoomByCode(roomCode)),
    loadMyRooms: () => dispatch(fetchMyRooms()),
    loadHistory: () => dispatch(fetchRoomHistory()),
    loadLiveRooms: () => dispatch(fetchLiveRooms()),
    resetGame: () => dispatch(roomActions.resetGame()),
  };
};
