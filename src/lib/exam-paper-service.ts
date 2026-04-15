/**
 * src/lib/exam-paper-service.ts
 *
 * Admin-assembled exam papers from approved question bank items.
 */

import { db } from "./db";
import type {
  ExamPaperRow,
  ExamPaperDetail,
  ExamPaperDetailItem,
  CreateExamPaperBody,
  AddExamPaperItemBody,
} from "@/types/api";
import type { DifficultyLevel, QuestionFormat } from "@/types/enums";
import type { AnswerChoice } from "@/types/domain";

// ── List ──────────────────────────────────────────────────────────────────────

export async function listExamPapers(filters: { gradeId?: string; topicId?: string }): Promise<ExamPaperRow[]> {
  const rows = await db.examPaper.findMany({
    where: {
      ...(filters.gradeId && { gradeId: filters.gradeId }),
      ...(filters.topicId && { topicId: filters.topicId }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      grade: { select: { level: true } },
      topic: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return rows.map(toRow);
}

// ── Get one (with items) ──────────────────────────────────────────────────────

export async function getExamPaperDetail(id: string): Promise<ExamPaperDetail | null> {
  const row = await db.examPaper.findUnique({
    where:   { id },
    include: {
      grade: { select: { level: true } },
      topic: { select: { name: true } },
      _count: { select: { items: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          questionBankItem: {
            select: {
              questionText: true,
              format: true,
              difficulty: true,
              correctAnswer: true,
              hint: true,
              choices: true,
            },
          },
        },
      },
    },
  });

  if (!row) return null;

  const detailItems: ExamPaperDetailItem[] = row.items.map((item) => ({
    id:                 item.id,
    orderIndex:         item.orderIndex,
    scoreWeight:        item.scoreWeight,
    questionBankItemId: item.questionBankItemId,
    questionText:       item.questionBankItem.questionText,
    format:             item.questionBankItem.format.toLowerCase() as QuestionFormat,
    difficulty:         item.questionBankItem.difficulty.toLowerCase() as DifficultyLevel,
    correctAnswer:      item.questionBankItem.correctAnswer,
    hint:               item.questionBankItem.hint,
    choices:            item.questionBankItem.choices as AnswerChoice[] | null,
  }));

  return { ...toRow(row), items: detailItems };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createExamPaper(body: CreateExamPaperBody): Promise<ExamPaperRow> {
  const grade = await db.grade.findUnique({ where: { id: body.gradeId } });
  if (!grade) throw new Error("Grade not found");

  const row = await db.examPaper.create({
    data: {
      title:       body.title,
      description: body.description ?? null,
      gradeId:     body.gradeId,
      topicId:     body.topicId ?? null,
      createdBy:   body.createdBy ?? null,
      status:      "draft",
    },
    include: {
      grade: { select: { level: true } },
      topic: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return toRow(row);
}

// ── Patch ─────────────────────────────────────────────────────────────────────

export async function patchExamPaper(
  id: string,
  data: { title?: string; description?: string; status?: string },
): Promise<ExamPaperRow | null> {
  const existing = await db.examPaper.findUnique({ where: { id } });
  if (!existing) return null;

  const row = await db.examPaper.update({
    where: { id },
    data:  {
      ...(data.title       !== undefined && { title:       data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status      !== undefined && { status:      data.status }),
    },
    include: {
      grade: { select: { level: true } },
      topic: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return toRow(row);
}

// ── Add item ──────────────────────────────────────────────────────────────────

export async function addExamPaperItem(
  paperId: string,
  body: AddExamPaperItemBody,
): Promise<ExamPaperDetailItem> {
  // Verify bank item is approved
  const bankItem = await db.questionBankItem.findUnique({ where: { id: body.questionBankItemId } });
  if (!bankItem) throw new Error("Question bank item not found");
  if (bankItem.reviewStatus !== "APPROVED") throw new Error("Only approved questions can be added to an exam paper.");

  // Auto-assign orderIndex if not provided
  let orderIndex = body.orderIndex;
  if (orderIndex === undefined) {
    const last = await db.examPaperItem.findFirst({
      where:   { examPaperId: paperId },
      orderBy: { orderIndex: "desc" },
    });
    orderIndex = (last?.orderIndex ?? 0) + 1;
  }

  const item = await db.examPaperItem.create({
    data: {
      examPaperId:        paperId,
      questionBankItemId: body.questionBankItemId,
      orderIndex,
      scoreWeight:        body.scoreWeight ?? 1,
    },
    include: {
      questionBankItem: {
        select: {
          questionText: true, format: true, difficulty: true,
          correctAnswer: true, hint: true, choices: true,
        },
      },
    },
  });

  return {
    id:                 item.id,
    orderIndex:         item.orderIndex,
    scoreWeight:        item.scoreWeight,
    questionBankItemId: item.questionBankItemId,
    questionText:       item.questionBankItem.questionText,
    format:             item.questionBankItem.format.toLowerCase() as QuestionFormat,
    difficulty:         item.questionBankItem.difficulty.toLowerCase() as DifficultyLevel,
    correctAnswer:      item.questionBankItem.correctAnswer,
    hint:               item.questionBankItem.hint,
    choices:            item.questionBankItem.choices as AnswerChoice[] | null,
  };
}

// ── Remove item ───────────────────────────────────────────────────────────────

export async function removeExamPaperItem(paperId: string, itemId: string): Promise<boolean> {
  const item = await db.examPaperItem.findFirst({
    where: { id: itemId, examPaperId: paperId },
  });
  if (!item) return false;
  await db.examPaperItem.delete({ where: { id: itemId } });
  return true;
}

// ── Internal mapper ───────────────────────────────────────────────────────────

type PaperWithRelations = {
  id: string; title: string; description: string | null; status: string;
  gradeId: string; topicId: string | null; createdBy: string | null;
  createdAt: Date; updatedAt: Date;
  grade: { level: number };
  topic: { name: string } | null;
  _count: { items: number };
};

function toRow(r: PaperWithRelations): ExamPaperRow {
  return {
    id:          r.id,
    title:       r.title,
    description: r.description,
    status:      r.status,
    gradeId:     r.gradeId,
    gradeLevel:  r.grade.level,
    topicId:     r.topicId,
    topicName:   r.topic?.name ?? null,
    createdBy:   r.createdBy,
    itemCount:   r._count.items,
    createdAt:   r.createdAt.toISOString(),
    updatedAt:   r.updatedAt.toISOString(),
  };
}
