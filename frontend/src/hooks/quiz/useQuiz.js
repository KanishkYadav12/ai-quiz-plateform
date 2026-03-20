'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  generateQuiz,
  fetchMyQuizzes,
  fetchQuizById,
  deleteQuiz,
  toggleQuizPublish,
} from '@/redux/actions/quiz/quizAction'
import {
  selectQuizList,
  selectQuizDetails,
  selectQuizCreate,
  selectQuizDelete,
  selectQuizPublish,
  quizActions,
} from '@/redux/slices/quiz/quizSlice'

export const useQuiz = () => {
  const dispatch = useDispatch()
  const router   = useRouter()

  const listOp    = useSelector(selectQuizList)
  const detailsOp = useSelector(selectQuizDetails)
  const createOp  = useSelector(selectQuizCreate)
  const deleteOp  = useSelector(selectQuizDelete)
  const publishOp = useSelector(selectQuizPublish)

  const [createLoading, setCreateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── create / generate effect ──────────────────────────────
  useEffect(() => {
    if (createOp.status === 'pending') setCreateLoading(true)
    if (createOp.status === 'success') {
      setCreateLoading(false)
      toast.success('Quiz generated successfully!')
      const quizId = createOp.data?._id
      dispatch(quizActions.clearCreate())
      if (quizId) router.push(`/quiz/${quizId}`)
    }
    if (createOp.status === 'failed') {
      setCreateLoading(false)
      toast.error(createOp.error || 'AI generation failed')
      dispatch(quizActions.clearCreate())
    }
  }, [createOp.status])

  // ── delete effect ─────────────────────────────────────────
  useEffect(() => {
    if (deleteOp.status === 'pending') setDeleteLoading(true)
    if (deleteOp.status === 'success') {
      setDeleteLoading(false)
      toast.success('Quiz deleted')
      dispatch(quizActions.clearDelete())
    }
    if (deleteOp.status === 'failed') {
      setDeleteLoading(false)
      toast.error(deleteOp.error || 'Failed to delete quiz')
      dispatch(quizActions.clearDelete())
    }
  }, [deleteOp.status])

  // ── publish effect ────────────────────────────────────────
  useEffect(() => {
    if (publishOp.status === 'success') {
      toast.success(`Quiz is now ${publishOp.data?.isPublic ? 'public' : 'private'}`)
      dispatch(quizActions.clearPublish())
    }
    if (publishOp.status === 'failed') {
      toast.error(publishOp.error || 'Failed to update quiz')
      dispatch(quizActions.clearPublish())
    }
  }, [publishOp.status])

  return {
    // state
    quizzes:       listOp.data    || [],
    quiz:          detailsOp.data || null,
    listLoading:   listOp.status    === 'pending',
    detailLoading: detailsOp.status === 'pending',
    createLoading,
    deleteLoading,
    listError:   listOp.error,
    detailError: detailsOp.error,

    // actions
    generate:      (payload)            => dispatch(generateQuiz(payload)),
    loadMyQuizzes: ()                   => dispatch(fetchMyQuizzes()),
    loadQuiz:      (quizId)             => dispatch(fetchQuizById(quizId)),
    removeQuiz:    (quizId)             => dispatch(deleteQuiz(quizId)),
    publishQuiz:   (quizId, isPublic)   => dispatch(toggleQuizPublish(quizId, isPublic)),
  }
}
