import { Router } from 'express'
import {
  createRoomController,
  getRoomController,
  getMyRoomsController,
  getRoomHistoryController,
  getLiveRoomsController,
} from '../controllers/room.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = Router()

// All room routes require authentication
router.use(protect)

router.post('/create',    createRoomController)
router.get('/live',       getLiveRoomsController)
router.get('/my-rooms',   getMyRoomsController)
router.get('/history',    getRoomHistoryController)
router.get('/:roomCode',  getRoomController)

export default router
