/**
 * src/lib/practice-mappers.ts
 *
 * Maps Prisma records into API response shapes for the practice flow.
 * Keeps route handlers thin — all DB→response transformation lives here.
 */

import type { Prisma } from "@prisma/client";
import type { ExamSessionItem, GetExamResultResponse } from "@/types/api";
import type { AnswerChoice, WrongAnswerDetail } from "@/types/domain";
import type { QuestionFormat } from "@/types/enums";

// ── Payload types ──────────────────────────────────────────────────────────────

export type PrismaExamItem = Prisma.ExamItemGetPayload<Record<string, never>>;

export type PrismaSubmissionFull = Prisma.SubmissionGetPayload<{
  include: {
    exam: { include: { topic: true } };
    answers: { include: { examItem: true } };
  };
}>;

// ── Choice JSON helper ─────────────────────────────────────────────────────────

function parseChoices(raw: Prisma.JsonValue): AnswerChoice[] | undefined {
  if (!raw || !Array.isArray(raw)) return undefined;
  return (raw as Array<{ id: string; text: string; isCorrect: boolean }>).map(
    (c) => ({ id: c.id, text: c.text, isCorrect: c.isCorrect }),
  );
}

function toQuestionFormat(val: string): QuestionFormat {
  return val.toLowerCase() as QuestionFormat;
}

// ── ExamItem → ExamSessionItem ──────────────────────────────────────────────────

/**
 * Convert a single Prisma ExamItem row to the client-facing ExamSessionItem.
 * correctAnswer is intentionally included for instant local feedback (MVP).
 */
export function mapExamSessionItem(item: PrismaExamItem): ExamSessionItem {
  return {
    id:             item.id,
    orderIndex:     item.orderIndex,
    questionText:   item.questionText,
    questionFormat: toQuestionFormat(item.questionFormat),
    correctAnswer:  item.correctAnswer,
    hint:           item.hint ?? undefined,
    choices:        parseChoices(item.choices),
  };
}

// ── Submission → GetExamResultResponse ────────────────────────────────────────

/**
 * Convert a graded Submission (with answers + exam + topic) into the result
 * payload. Shape matches ExamResult domain type so components work directly.
 */
export function mapExamResultResponse(
  sub: PrismaSubmissionFull,
): GetExamResultResponse {
  const wrongAnswers: WrongAnswerDetail[] = sub.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionId:    a.examItemId,
      questionText:  a.examItem.questionText,
      givenAnswer:   a.givenAnswer,
      correctAnswer: a.examItem.correctAnswer,
      hint:          a.examItem.hint ?? undefined,
    }));

  return {
    examId:              sub.examId,
    topicName:           sub.exam.topic.name,
    score:               sub.score,
    totalQuestions:      sub.totalQuestions,
    accuracy:            Math.round(sub.accuracy),
    durationSeconds:     sub.durationSeconds ?? 0,
    wrongAnswers,
    nextRecommendations:  [],
    encouragementMessage: null,
  };
}
