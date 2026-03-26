import { axiosRequest } from "@/lib/axiosClient";

export const roomService = {
  createRoom: (payload) => axiosRequest("POST", "/room/create", payload),
  activateRoom: (roomCode) =>
    axiosRequest("PATCH", `/room/${roomCode}/activate`),
  getLiveRooms: () => axiosRequest("GET", "/room/live"),
  getByCode: (roomCode) => axiosRequest("GET", `/room/${roomCode}`),
  getMyRooms: () => axiosRequest("GET", "/room/my-rooms"),
  getHistory: () => axiosRequest("GET", "/room/history"),
};
