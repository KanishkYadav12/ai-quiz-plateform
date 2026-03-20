import { z } from "zod";

export const generateQuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").trim(),
  topic: z.string().min(2, "Topic must be at least 2 characters").trim(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  totalQuestions: z.coerce.number().int().min(5).max(20),
  timePerQuestion: z.coerce.number().int().min(10).max(60).default(30),
  isPublic: z.boolean().default(false),
});

export const publishSchema = z.object({
  isPublic: z.boolean({ required_error: "isPublic must be a boolean" }),
});
