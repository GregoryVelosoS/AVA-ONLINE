import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const questionSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_TEXT", "LONG_TEXT", "FILE_UPLOAD"]),
  subject: z.string().min(2),
  statement: z.string().min(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  disciplineId: z.string().uuid(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        content: z.string().min(1),
        isCorrect: z.boolean(),
        position: z.number().int().positive()
      })
    )
    .optional()
});

export const examSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  disciplineId: z.string().uuid(),
  instructions: z.string().min(5),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("DRAFT"),
  maxAttempts: z.number().int().min(1).default(1),
  questionIds: z.array(z.string().uuid()).min(1)
});

export const startAttemptSchema = z.object({
  slug: z.string().min(2),
  studentName: z.string().min(2),
  classGroupName: z.string().min(2),
  disciplineInformed: z.string().min(2)
});

export const answerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().optional(),
  shortTextAnswer: z.string().optional(),
  longTextAnswer: z.string().optional(),
  confidenceLevel: z.number().int().min(1).max(3)
});

export const feedbackSchema = z.object({
  attemptId: z.string().uuid(),
  clarityScore: z.number().int().min(1).max(5),
  difficultyScore: z.number().int().min(1).max(5),
  timeAdequacyScore: z.number().int().min(1).max(5),
  contentAlignmentScore: z.number().int().min(1).max(5),
  selfAssessmentScore: z.number().int().min(1).max(5),
  confusingQuestionFlag: z.boolean(),
  openComment: z.string().max(2000).optional()
});
