import { quizActions } from '@/redux/slices/quiz/quizSlice'
import { quizService } from '@/services/quiz'

export const generateQuiz = (payload) => async (dispatch) => {
  dispatch(quizActions.createRequest())
  try {
    const data = await quizService.generate(payload)
    dispatch(quizActions.createSuccess(data.data.quiz))
  } catch (err) {
    dispatch(quizActions.createFailure(
      err.response?.data?.message || 'AI generation failed. Please try again.'
    ))
  }
}

export const fetchQuizAnalytics = (quizId) => async (dispatch) => {
  dispatch(quizActions.analyticsRequest())
  try {
    const data = await quizService.getAnalytics(quizId)
    dispatch(quizActions.analyticsSuccess(data.data.analytics))
  } catch (err) {
    dispatch(quizActions.analyticsFailure(
      err.response?.data?.message || 'Failed to load analytics'
    ))
  }
}

export const fetchPublicQuizzes = () => async (dispatch) => {
  dispatch(quizActions.publicListRequest())
  try {
    const data = await quizService.getPublic()
    dispatch(quizActions.publicListSuccess(data.data.quizzes))
  } catch (err) {
    dispatch(quizActions.publicListFailure(
      err.response?.data?.message || 'Failed to load public library'
    ))
  }
}

export const fetchMyQuizzes = () => async (dispatch) => {
  dispatch(quizActions.listRequest())
  try {
    const data = await quizService.getMyQuizzes()
    dispatch(quizActions.listSuccess(data.data.quizzes))
  } catch (err) {
    dispatch(quizActions.listFailure(
      err.response?.data?.message || 'Failed to load quizzes'
    ))
  }
}

export const fetchQuizById = (quizId) => async (dispatch) => {
  dispatch(quizActions.detailsRequest())
  try {
    const data = await quizService.getById(quizId)
    dispatch(quizActions.detailsSuccess(data.data.quiz))
  } catch (err) {
    dispatch(quizActions.detailsFailure(
      err.response?.data?.message || 'Failed to load quiz'
    ))
  }
}

export const deleteQuiz = (quizId) => async (dispatch) => {
  dispatch(quizActions.deleteRequest())
  try {
    await quizService.deleteQuiz(quizId)
    dispatch(quizActions.deleteSuccess({ quizId }))
  } catch (err) {
    dispatch(quizActions.deleteFailure(
      err.response?.data?.message || 'Failed to delete quiz'
    ))
  }
}

export const toggleQuizPublish = (quizId, isPublic) => async (dispatch) => {
  dispatch(quizActions.publishRequest())
  try {
    const data = await quizService.togglePublish(quizId, isPublic)
    dispatch(quizActions.publishSuccess(data.data.quiz))
  } catch (err) {
    dispatch(quizActions.publishFailure(
      err.response?.data?.message || 'Failed to update quiz'
    ))
  }
}
