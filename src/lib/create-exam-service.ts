/**
 * src/lib/create-exam-service.ts
 *
 * Orchestrates exam creation from the APPROVED question bank only.
 * AI generation is NOT triggered here â€” AI questions must be approved
 * by an admin before they can be used in student practice sessions.
 *
 * Flow:
 *   1. Load topic + grade
 *   2. Query approved bank items matching the request params
 *   3. If enough items exist â†’ shuffle and persist Exam + ExamItems
 *   4. If not enough â†’ throw InsufficientQuestionsError (caller returns 422)
 */

import { db } from "@/lib/db";
import type { DifficultyLevel, QuestionFormat, ExamMode } from "@/types/enums";
import type { Prisma } from "@prisma/client";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CreateExamInput {
  studentId:        string;
  topicId:          string;
  questionCount:    number;
  difficulty:       DifficultyLevel;
  format:           QuestionFormat;
  mode:             ExamMode;
  timeLimitMinutes?: number;
}

export interface CreateExamResult {
  examId:      string;
  generatedBy: "bank";
  itemCount:   number;
}

export class InsufficientQuestionsError extends Error {
  constructor(public readonly available: number, public readonly required: number) {
    super(`NgÃ¢n hÃ ng cÃ¢u há»i chá»‰ cÃ³ ${available} cÃ¢u phÃ¹ há»£p (cáº§n ${required}).`);
    this.name = "InsufficientQuestionsError";
  }
}

interface ExamItemCreateData {
  orderIndex:     number;
  questionText:   string;
  questionFormat: "MCQ" | "FILLIN";
  difficulty:     "EASY" | "MEDIUM" | "HARD";
  correctAnswer:  string;
  hint:           string | null;
  choices?:       Prisma.JsonArray;
}

// â”€â”€ Main service function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createExam(input: CreateExamInput): Promise<CreateExamResult> {
  const { studentId, topicId, questionCount, difficulty, format, mode, timeLimitMinutes } = input;

  // 1. Load topic + grade
  const topic = await db.curriculumTopic.findUniqueOrThrow({
    where:   { id: topicId },
    include: { grade: true },
  });

  // 2. Fetch approved bank items (fetch extra for random variety)
  const bankRows = await db.questionBankItem.findMany({
    where: {
      topicId,
      difficulty:   difficulty.toUpperCase()   as "EASY" | "MEDIUM" | "HARD",
      format:       format.toUpperCase()       as "MCQ"  | "FILLIN",
      reviewStatus: "APPROVED",
      isActive:     true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: questionCount * 5,
  });

  // 3. Shuffle and slice
  const shuffled = bankRows.sort(() => Math.random() - 0.5).slice(0, questionCount);

  if (shuffled.length < questionCount) {
    throw new InsufficientQuestionsError(shuffled.length, questionCount);
  }

  // 4. Persist exam + items
  const items: ExamItemCreateData[] = shuffled.map((r, i) => ({
    orderIndex:     i + 1,
    questionText:   r.questionText,
    questionFormat: r.format    as "MCQ" | "FILLIN",
    difficulty:     r.difficulty as "EASY" | "MEDIUM" | "HARD",
    correctAnswer:  r.correctAnswer,
    hint:           r.hint ?? null,
    choices:        r.choices != null ? (r.choices as unknown as Prisma.JsonArray) : undefined,
  }));

  const exam = await db.$transaction(async (tx) => {
    const newExam = await tx.exam.create({
      data: {
        studentId, topicId, gradeId: topic.gradeId,
        questionCount: shuffled.length,
        difficulty:       difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        format:           format.toUpperCase()     as "MCQ"  | "FILLIN",
        mode:             mode === "timed_exam" ? "TIMED_EXAM" : "PRACTICE",
        timeLimitMinutes: mode === "timed_exam" ? (timeLimitMinutes ?? null) : null,
      },
    });
    await tx.examItem.createMany({ data: items.map((item) => ({ examId: newExam.id, ...item })) });
    return newExam;
  });

  return { examId: exam.id, generatedBy: "bank", itemCount: shuffled.length };
}
