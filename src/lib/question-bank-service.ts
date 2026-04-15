/**
 * src/lib/question-bank-service.ts
 *
 * CRUD + list operations for QuestionBankItem.
 * Pure DB layer — no HTTP concerns.
 */

import { Prisma } from "@prisma/client";
import { db } from "./db";
import type {
  QuestionBankItemRow,
  CreateQuestionBankItemBody,
  PatchQuestionBankItemBody,
} from "@/types/api";
import type { DifficultyLevel, QuestionFormat, QuestionSource, ReviewStatus } from "@/types/enums";
import type { AnswerChoice } from "@/types/domain";

// ── Filters ───────────────────────────────────────────────────────────────────

export interface BankListFilters {
  gradeId?:      string;
  topicId?:      string;
  skillId?:      string;
  difficulty?:   DifficultyLevel;
  format?:       QuestionFormat;
  source?:       QuestionSource;
  reviewStatus?: ReviewStatus;
  isActive?:     boolean;
  page?:         number; // 1-based
  pageSize?:     number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toSourceEnum(s: QuestionSource): "MANUAL" | "IMPORTED" | "AI_GENERATED" {
  const map: Record<QuestionSource, "MANUAL" | "IMPORTED" | "AI_GENERATED"> = {
    manual: "MANUAL", imported: "IMPORTED", ai_generated: "AI_GENERATED",
  };
  return map[s];
}

function fromSourceEnum(s: string): QuestionSource {
  return s.toLowerCase() as QuestionSource;
}

function toReviewEnum(s: ReviewStatus): "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED" {
  const map: Record<ReviewStatus, "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED"> = {
    draft: "DRAFT", pending_review: "PENDING_REVIEW", approved: "APPROVED",
    rejected: "REJECTED", archived: "ARCHIVED",
  };
  return map[s];
}

function fromReviewEnum(s: string): ReviewStatus {
  return s.toLowerCase() as ReviewStatus;
}

function fromDiffEnum(s: string): DifficultyLevel {
  return s.toLowerCase() as DifficultyLevel;
}

function fromFormatEnum(s: string): QuestionFormat {
  return s.toLowerCase() as QuestionFormat;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listBankItems(filters: BankListFilters): Promise<{ items: QuestionBankItemRow[]; total: number }> {
  const page     = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 30));
  const skip     = (page - 1) * pageSize;

  const where = {
    ...(filters.gradeId      && { gradeId: filters.gradeId }),
    ...(filters.topicId      && { topicId: filters.topicId }),
    ...(filters.skillId      && { skillId: filters.skillId }),
    ...(filters.difficulty   && { difficulty: filters.difficulty.toUpperCase() as never }),
    ...(filters.format       && { format: filters.format.toUpperCase() as never }),
    ...(filters.source       && { source: toSourceEnum(filters.source) }),
    ...(filters.reviewStatus && { reviewStatus: toReviewEnum(filters.reviewStatus) }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
  };

  const [rows, total] = await Promise.all([
    db.questionBankItem.findMany({
      where,
      skip,
      take:    pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        topic: { select: { name: true } },
        grade: { select: { level: true } },
        skill: { select: { name: true } },
      },
    }),
    db.questionBankItem.count({ where }),
  ]);

  const items: QuestionBankItemRow[] = rows.map(mapRow);

  return { items, total };
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

const BANK_INCLUDE = {
  topic: { select: { name: true } },
  grade: { select: { level: true } },
  skill: { select: { name: true } },
} as const;

async function fetchBankRow(id: string) {
  return db.questionBankItem.findUnique({ where: { id }, include: BANK_INCLUDE });
}

function mapRow(
  r: NonNullable<Awaited<ReturnType<typeof fetchBankRow>>>,
): QuestionBankItemRow {
  return {
    id: r.id, topicId: r.topicId, topicName: r.topic.name,
    gradeId: r.gradeId, gradeLevel: r.grade.level,
    skillId: r.skillId, skillName: r.skill?.name ?? null,
    questionText: r.questionText,
    format: fromFormatEnum(r.format),
    difficulty: fromDiffEnum(r.difficulty),
    correctAnswer: r.correctAnswer,
    hint: r.hint, choices: r.choices as AnswerChoice[] | null,
    source: fromSourceEnum(r.source),
    reviewStatus: fromReviewEnum(r.reviewStatus),
    isActive: r.isActive,
    modelUsed: r.modelUsed,
    blueprintId: r.blueprintId,
    promptTemplateVersion: r.promptTemplateVersion,
    validatorSummary: r.validatorSummary as { passed: boolean; errors: string[] } | null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createBankItem(body: CreateQuestionBankItemBody): Promise<QuestionBankItemRow> {
  const topic = await db.curriculumTopic.findUnique({
    where:  { id: body.topicId },
    select: { gradeId: true },
  });
  if (!topic) throw new Error("Topic not found");

  const created = await db.questionBankItem.create({
    data: {
      topicId:      body.topicId,
      gradeId:      topic.gradeId,
      skillId:      body.skillId ?? null,
      questionText: body.questionText,
      format:       body.format.toUpperCase() as never,
      difficulty:   body.difficulty.toUpperCase() as never,
      correctAnswer: body.correctAnswer,
      hint:          body.hint ?? null,
      choices:       (body.choices as unknown as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      source:        body.source ? toSourceEnum(body.source) : "MANUAL",
      reviewStatus:  body.reviewStatus ? toReviewEnum(body.reviewStatus) : "DRAFT",
    },
  });
  const row = await fetchBankRow(created.id);
  if (!row) throw new Error("Failed to fetch created item");
  return mapRow(row);
}

// ── Patch ─────────────────────────────────────────────────────────────────────

export async function patchBankItem(id: string, body: PatchQuestionBankItemBody): Promise<QuestionBankItemRow | null> {
  const existing = await db.questionBankItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  await db.questionBankItem.update({
    where: { id },
    data:  {
      ...(body.questionText  !== undefined && { questionText:  body.questionText }),
      ...(body.difficulty    !== undefined && { difficulty:    body.difficulty.toUpperCase() as never }),
      ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer }),
      ...(body.hint          !== undefined && { hint:          body.hint }),
      ...(body.choices !== undefined && {
        choices: (body.choices as unknown as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      }),
      ...(body.reviewStatus  !== undefined && { reviewStatus:  toReviewEnum(body.reviewStatus) }),
      ...(body.isActive      !== undefined && { isActive:      body.isActive }),
    },
  });

  const row = await fetchBankRow(id);
  return row ? mapRow(row) : null;
}

// ── Archive (soft delete) ─────────────────────────────────────────────────────

export async function archiveBankItem(id: string): Promise<boolean> {
  const existing = await db.questionBankItem.findUnique({ where: { id } });
  if (!existing) return false;
  await db.questionBankItem.update({
    where: { id },
    data:  { reviewStatus: "ARCHIVED", isActive: false },
  });
  return true;
}
