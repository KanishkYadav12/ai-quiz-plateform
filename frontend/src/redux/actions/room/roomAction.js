import { roomActions } from '@/redux/slices/room/roomSlice'
import { roomService } from '@/services/room'

export const createRoom = (payload) => async (dispatch) => {
  dispatch(roomActions.createRequest())
  try {
    const data = await roomService.createRoom(payload)
    dispatch(roomActions.createSuccess(data.data.room))
  } catch (err) {
    dispatch(roomActions.createFailure(
      err.response?.data?.message || 'Failed to create room'
    ))
  }
}

export const fetchRoomByCode = (roomCode) => async (dispatch) => {
  dispatch(roomActions.detailsRequest())
  try {
    const data = await roomService.getByCode(roomCode)
    dispatch(roomActions.detailsSuccess(data.data.room))
  } catch (err) {
    dispatch(roomActions.detailsFailure(
      err.response?.data?.message || 'Room not found'
    ))
  }
}

export const fetchMyRooms = () => async (dispatch) => {
  dispatch(roomActions.myRoomsRequest())
  try {
    const data = await roomService.getMyRooms()
    dispatch(roomActions.myRoomsSuccess(data.data.rooms))
  } catch (err) {
    dispatch(roomActions.myRoomsFailure(
      err.response?.data?.message || 'Failed to load rooms'
    ))
  }
}

export const fetchRoomHistory = () => async (dispatch) => {
  dispatch(roomActions.historyRequest())
  try {
    const data = await roomService.getHistory()
    dispatch(roomActions.historySuccess(data.data.rooms))
  } catch (err) {
    dispatch(roomActions.historyFailure(
      err.response?.data?.message || 'Failed to load history'
    ))
  }
}
