import Groq from "groq-sdk";
import { getEnv } from "./env.config.js";
import { AppError } from "../utils/appError.js";

const groq = new Groq({ apiKey: getEnv("GEMINI_API_KEY") });

const buildPrompt = (topic, difficulty, count) =>
  `
You are a quiz master. Generate ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation — just the raw JSON array.
Each item must follow this EXACT format:
[
  {
    "questionText": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation of why this is correct"
  }
]

Rules:
- Each question must have exactly 4 options
- correctAnswer must be one of the 4 options (exact string match)
- Questions must be clear and unambiguous
- easy = basic concepts, medium = applied knowledge, hard = advanced/tricky
- Return ONLY the JSON array. Nothing else.
`.trim();

const validateQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    throw new AppError("AI response is not an array", 502, "AI_PARSE_ERROR");
  }

  questions.forEach((q, i) => {
    const num = i + 1;
    if (!q.questionText || typeof q.questionText !== "string") {
      throw new AppError(
        `Question ${num}: missing questionText`,
        502,
        "AI_PARSE_ERROR",
      );
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new AppError(
        `Question ${num}: must have exactly 4 options`,
        502,
        "AI_PARSE_ERROR",
      );
    }
    if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
      throw new AppError(
        `Question ${num}: correctAnswer must be one of the 4 options`,
        502,
        "AI_PARSE_ERROR",
      );
    }
  });

  return questions;
};

export const generateQuestionsFromAI = async ({ topic, difficulty, count }) => {
  const prompt = buildPrompt(topic, difficulty, count);

  let rawText;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    rawText = completion.choices[0]?.message?.content?.trim();
  } catch (err) {
    throw new AppError(
      `Groq AI error: ${err.message}`,
      502,
      "AI_GENERATION_ERROR",
    );
  }

  if (!rawText) {
    throw new AppError("AI returned empty response", 502, "AI_EMPTY_RESPONSE");
  }

  // Extract JSON array even if model adds surrounding text
  const match = rawText.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new AppError(
      "Could not find JSON array in AI response",
      502,
      "AI_PARSE_ERROR",
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new AppError("AI response is not valid JSON", 502, "AI_PARSE_ERROR");
  }

  return validateQuestions(parsed);
};
