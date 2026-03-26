import { axiosRequest } from "@/lib/axiosClient";

export const quizService = {
  generate: (payload) => axiosRequest("POST", "/quiz/generate", payload),
  clone: (quizId, creationMode = "play_now") =>
    axiosRequest("POST", `/quiz/${quizId}/clone`, { creationMode }),
  getMyQuizzes: () => axiosRequest("GET", "/quiz/my-quizzes"),
  getPublic: () => axiosRequest("GET", "/quiz/public"),
  getById: (quizId) => axiosRequest("GET", `/quiz/${quizId}`),
  getAnalytics: (quizId) => axiosRequest("GET", `/quiz/${quizId}/analytics`),
  rateQuiz: (quizId, rating) =>
    axiosRequest("POST", `/quiz/${quizId}/rate`, { rating }),
  deleteQuiz: (quizId) => axiosRequest("DELETE", `/quiz/${quizId}`),
  togglePublish: (quizId, isPublic) =>
    axiosRequest("PATCH", `/quiz/${quizId}/publish`, { isPublic }),
};
