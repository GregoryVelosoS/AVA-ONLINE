import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const optionalVisualSupportType = z.enum(["NONE", "ASSET", "CODE"]).optional().default("NONE");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const questionOptionSchema = z.object({
  label: z.string().min(1),
  content: z.string().min(1),
  isCorrect: z.boolean(),
  position: z.coerce.number().int().positive()
});

const questionBaseSchema = z.object({
  code: z.string().min(2),
  title: optionalText,
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_TEXT", "LONG_TEXT", "FILE_UPLOAD"]),
  subject: z.string().min(2),
  topic: optionalText,
  statement: z.string().min(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  disciplineId: z.string().uuid(),
  context: optionalText,
  visualSupportType: optionalVisualSupportType,
  supportCode: optionalText,
  expectedFeedback: optionalText,
  answerExplanation: optionalText,
  studyTopics: optionalText,
  studyLinks: optionalText,
  referencePlaylist: optionalText,
  complementaryNotes: optionalText,
  supportImagePath: optionalText,
  supportImageName: optionalText,
  supportImageMime: optionalText,
  supportFilePath: optionalText,
  supportFileName: optionalText,
  supportFileMime: optionalText,
  defaultWeight: z.coerce.number().positive().default(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  options: z.array(questionOptionSchema).default([])
});

export const questionSchema = questionBaseSchema.superRefine((data, ctx) => {
  if (data.type === "MULTIPLE_CHOICE") {
    const correctCount = data.options.filter((option) => option.isCorrect).length;

    if (data.options.length < 2 || correctCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Questão objetiva exige pelo menos 2 opções e 1 correta"
      });
    }
  }

  if (data.visualSupportType === "CODE" && !data.supportCode?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["supportCode"],
      message: "Informe o bloco de código quando o suporte visual for do tipo código."
    });
  }

  if (data.visualSupportType === "ASSET" && !data.supportImagePath?.trim() && !data.supportFilePath?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["visualSupportType"],
      message: "Envie uma imagem ou arquivo quando o suporte visual for do tipo imagem/arquivo."
    });
  }
});

export const questionImportSchema = z.object({
  questions: z.array(questionBaseSchema).min(1)
});

export const examSchema = z.object({
  title: z.string().min(3),
  publicCode: z
    .string()
    .trim()
    .min(4)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, hífen ou underline."),
  description: optionalText,
  disciplineId: z.string().uuid(),
  targetClassGroupId: optionalUuid,
  instructions: optionalText,
  startAt: z.string().datetime().optional().or(z.literal("")),
  endAt: z.string().datetime().optional().or(z.literal("")),
  timeLimitMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("DRAFT"),
  maxAttempts: z.coerce.number().int().min(1).default(1),
  questionIds: z.array(z.string().uuid()).default([])
});

export const disciplineSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120)
});

export const classGroupSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  disciplineId: optionalUuid
});

export const startAttemptSchema = z.object({
  publicCode: z.string().trim().min(4).max(20),
  studentName: z.string().min(2),
  classGroupName: z.string().min(2),
  disciplineInformed: z.string().min(2)
});

export const examLookupSchema = z.object({
  publicCode: z.string().trim().min(4).max(20)
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
  generalDifficulty: z.number().int().min(1).max(5),
  difficultContents: z.array(z.string().min(1)).min(1),
  commonDifficultyType: z.string().min(1),
  selfPerformance: z.number().int().min(1).max(5),
  explanationClarity: z.number().int().min(1).max(5),
  classPace: z.number().int().min(1).max(5),
  exerciseUsefulness: z.number().int().min(1).max(5),
  soloConfidence: z.number().int().min(1).max(5),
  helpfulClassFormats: z.array(z.string().min(1)).min(1),
  needsReview: z.string().min(1),
  toolDifficulties: z.array(z.string().min(1)).default([]),
  finalComment: z.string().max(2000).optional().or(z.literal(""))
});

export const issueReportSchema = z.object({
  type: z.enum(["SUGGESTION", "BUG", "QUESTION"]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  sourcePath: z.string().trim().min(1).max(240),
  sourceUrl: optionalText,
  contextLabel: optionalText,
  examId: optionalUuid,
  attemptId: optionalUuid
});

export const issueReportStatusSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "RESOLVED", "ARCHIVED"]),
  internalNotes: optionalText
});
