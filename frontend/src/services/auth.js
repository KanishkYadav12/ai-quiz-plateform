import { axiosRequest } from '@/lib/axiosClient'

export const authService = {
  register: (payload) => axiosRequest('POST', '/auth/register', payload),
  login:    (payload) => axiosRequest('POST', '/auth/login', payload),
  getMe:    ()        => axiosRequest('GET',  '/auth/me'),
}
