import { axiosRequest } from '@/lib/axiosClient'

export const quizService = {
  generate:    (payload)          => axiosRequest('POST',   '/quiz/generate', payload),
  getMyQuizzes: ()                => axiosRequest('GET',    '/quiz/my-quizzes'),
  getById:     (quizId)           => axiosRequest('GET',    `/quiz/${quizId}`),
  deleteQuiz:  (quizId)           => axiosRequest('DELETE', `/quiz/${quizId}`),
  togglePublish: (quizId, isPublic) => axiosRequest('PATCH', `/quiz/${quizId}/publish`, { isPublic }),
}
