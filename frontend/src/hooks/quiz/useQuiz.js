"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  generateQuiz,
  cloneQuiz,
  fetchMyQuizzes,
  fetchQuizById,
  deleteQuiz,
  toggleQuizPublish,
  fetchPublicQuizzes,
  fetchQuizAnalytics,
  rateQuiz as rateQuizAction,
} from "@/redux/actions/quiz/quizAction";
import {
  selectQuizList,
  selectPublicQuizList,
  selectQuizDetails,
  selectQuizAnalytics,
  selectQuizCreate,
  selectQuizClone,
  selectQuizDelete,
  selectQuizPublish,
  selectQuizRate,
  quizActions,
} from "@/redux/slices/quiz/quizSlice";

export const useQuiz = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const listOp = useSelector(selectQuizList);
  const publicListOp = useSelector(selectPublicQuizList);
  const detailsOp = useSelector(selectQuizDetails);
  const analyticsOp = useSelector(selectQuizAnalytics);
  const createOp = useSelector(selectQuizCreate);
  const cloneOp = useSelector(selectQuizClone);
  const deleteOp = useSelector(selectQuizDelete);
  const publishOp = useSelector(selectQuizPublish);
  const rateOp = useSelector(selectQuizRate);

  const [createLoading, setCreateLoading] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── create / generate effect ──────────────────────────────
  useEffect(() => {
    if (createOp.status === "pending") setCreateLoading(true);
    if (createOp.status === "success") {
      setCreateLoading(false);
      const quiz = createOp.data?.quiz;
      const room = createOp.data?.room;
      if (quiz?._id) {
        dispatch(quizActions.clearCreate());
        if (quiz.creationMode === "play_now" && room?.roomCode) {
          router.replace(`/room/${room.roomCode}/lobby`);
          return;
        }
        router.replace(`/dashboard`);
        return;
      }
      toast.error("Quiz created, but redirect target was missing.");
      dispatch(quizActions.clearCreate());
    }
    if (createOp.status === "failed") {
      setCreateLoading(false);
      toast.error(createOp.error || "AI generation failed");
      dispatch(quizActions.clearCreate());
    }
  }, [createOp.status, createOp.data, createOp.error, dispatch, router]);

  // ── clone effect ───────────────────────────────────────────
  useEffect(() => {
    if (cloneOp.status === "pending") setCloneLoading(true);
    if (cloneOp.status === "success") {
      setCloneLoading(false);
      const quiz = cloneOp.data?.quiz;
      const room = cloneOp.data?.room;
      toast.success("Quiz cloned successfully.");
      dispatch(quizActions.clearClone());

      if (quiz?.creationMode === "play_now" && room?.roomCode) {
        router.push(`/room/${room.roomCode}/lobby`);
        return;
      }

      router.push(`/dashboard`);
    }
    if (cloneOp.status === "failed") {
      setCloneLoading(false);
      toast.error(cloneOp.error || "Failed to clone quiz");
      dispatch(quizActions.clearClone());
    }
  }, [cloneOp.status, cloneOp.data, cloneOp.error, dispatch, router]);

  // ── delete effect ─────────────────────────────────────────
  useEffect(() => {
    if (deleteOp.status === "pending") setDeleteLoading(true);
    if (deleteOp.status === "success") {
      setDeleteLoading(false);
      toast.success("Quiz deleted");
      dispatch(quizActions.clearDelete());
    }
    if (deleteOp.status === "failed") {
      setDeleteLoading(false);
      toast.error(deleteOp.error || "Failed to delete quiz");
      dispatch(quizActions.clearDelete());
    }
  }, [deleteOp.status]);

  // ── publish effect ────────────────────────────────────────
  useEffect(() => {
    if (publishOp.status === "success") {
      toast.success(
        `Quiz is now ${publishOp.data?.isPublic ? "public" : "private"}`,
      );
      dispatch(quizActions.clearPublish());
    }
    if (publishOp.status === "failed") {
      toast.error(publishOp.error || "Failed to update quiz");
      dispatch(quizActions.clearPublish());
    }
  }, [publishOp.status]);

  // ── rate effect ──────────────────────────────────────────
  useEffect(() => {
    if (rateOp.status === "success") {
      toast.success("Rating submitted! Thank you.");
      dispatch(quizActions.clearRate());
    }
    if (rateOp.status === "failed") {
      toast.error(rateOp.error || "Failed to submit rating");
      dispatch(quizActions.clearRate());
    }
  }, [rateOp.status]);

  return {
    // state
    quizzes: listOp.data || [],
    publicQuizzes: publicListOp.data || [],
    quiz: detailsOp.data || null,
    analytics: analyticsOp.data || null,
    listLoading: listOp.status === "pending",
    publicListLoading: publicListOp.status === "pending",
    detailLoading: detailsOp.status === "pending",
    analyticsLoading: analyticsOp.status === "pending",
    createLoading,
    cloneLoading,
    deleteLoading,
    listError: listOp.error,
    detailError: detailsOp.error,

    // actions
    generate: (payload) => dispatch(generateQuiz(payload)),
    cloneFromQuiz: (quizId, creationMode) =>
      dispatch(cloneQuiz(quizId, creationMode)),
    loadMyQuizzes: () => dispatch(fetchMyQuizzes()),
    loadPublicQuizzes: () => dispatch(fetchPublicQuizzes()),
    loadQuiz: (quizId) => dispatch(fetchQuizById(quizId)),
    loadAnalytics: (quizId) => dispatch(fetchQuizAnalytics(quizId)),
    removeQuiz: (quizId) => dispatch(deleteQuiz(quizId)),
    publishQuiz: (quizId, isPublic) =>
      dispatch(toggleQuizPublish(quizId, isPublic)),
    submitRating: (quizId, rating) => dispatch(rateQuizAction(quizId, rating)),
  };
};
