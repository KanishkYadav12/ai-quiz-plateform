import { axiosRequest } from '@/lib/axiosClient'

export const userService = {
  getCoinsLeaderboard: () => axiosRequest('GET', '/leaderboard/coins'),
  getRatioLeaderboard: () => axiosRequest('GET', '/leaderboard/ratio'),
  getProfile: (userId)    => axiosRequest('GET', `/user/profile/${userId}`),
}
