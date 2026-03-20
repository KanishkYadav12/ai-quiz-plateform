import { axiosRequest } from '@/lib/axiosClient'

export const roomService = {
  createRoom:  (payload)   => axiosRequest('POST', '/room/create', payload),
  getByCode:   (roomCode)  => axiosRequest('GET',  `/room/${roomCode}`),
  getMyRooms:  ()          => axiosRequest('GET',  '/room/my-rooms'),
  getHistory:  ()          => axiosRequest('GET',  '/room/history'),
}
