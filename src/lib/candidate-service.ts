/**
 * src/lib/candidate-service.ts
 *
 * Operations for QuestionCandidate — AI-generated questions pending admin review.
 * Approved candidates are promoted to QuestionBankItem.
 */

import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { QuestionCandidateRow, ReviewCandidateBody } from "@/types/api";
import type { DifficultyLevel, QuestionFormat, CandidateStatus } from "@/types/enums";
import type { AnswerChoice } from "@/types/domain";

// ── Filters ───────────────────────────────────────────────────────────────────

export interface CandidateFilters {
  topicId?:         string;
  gradeId?:         string;
  candidateStatus?: CandidateStatus;
  modelUsed?:       string;
  page?:            number;
  pageSize?:        number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function fromCandidateStatus(s: string): CandidateStatus {
  return s.toLowerCase() as CandidateStatus;
}

function toCandidateEnum(s: CandidateStatus): "PENDING_REVIEW" | "APPROVED" | "REJECTED" {
  const map: Record<CandidateStatus, "PENDING_REVIEW" | "APPROVED" | "REJECTED"> = {
    pending_review: "PENDING_REVIEW", approved: "APPROVED", rejected: "REJECTED",
  };
  return map[s];
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listCandidates(
  filters: CandidateFilters,
): Promise<{ candidates: QuestionCandidateRow[]; total: number }> {
  const page     = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 30));
  const skip     = (page - 1) * pageSize;

  const where = {
    ...(filters.topicId  && { topicId: filters.topicId }),
    ...(filters.gradeId  && { gradeId: filters.gradeId }),
    ...(filters.candidateStatus && { candidateStatus: toCandidateEnum(filters.candidateStatus) }),
    ...(filters.modelUsed  && { modelUsed: filters.modelUsed }),
  };

  const [rows, total] = await db.$transaction([
    db.questionCandidate.findMany({
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
    db.questionCandidate.count({ where }),
  ]);

  const candidates: QuestionCandidateRow[] = rows.map(mapCandidate);
  return { candidates, total };
}

// ── Get one ───────────────────────────────────────────────────────────────────

export async function getCandidate(id: string): Promise<QuestionCandidateRow | null> {
  const row = await db.questionCandidate.findUnique({
    where:   { id },
    include: {
      topic: { select: { name: true } },
      grade: { select: { level: true } },
      skill: { select: { name: true } },
    },
  });
  return row ? mapCandidate(row) : null;
}

// ── Review (approve / reject / approve_with_edits) ────────────────────────────

export async function reviewCandidate(
  id: string,
  body: ReviewCandidateBody,
): Promise<QuestionCandidateRow | null> {
  const candidate = await db.questionCandidate.findUnique({
    where:   { id },
    include: {
      topic: { select: { name: true, gradeId: true } },
      grade: { select: { level: true } },
      skill: { select: { name: true } },
    },
  });
  if (!candidate) return null;
  if (candidate.candidateStatus !== "PENDING_REVIEW") {
    throw new Error(`Candidate already ${fromCandidateStatus(candidate.candidateStatus)}.`);
  }

  const now = new Date();

  if (body.action === "reject") {
    const updated = await db.questionCandidate.update({
      where: { id },
      data:  {
        candidateStatus: "REJECTED",
        reviewedAt:      now,
        reviewedBy:      body.reviewedBy ?? null,
      },
      include: {
        topic: { select: { name: true } },
        grade: { select: { level: true } },
        skill: { select: { name: true } },
      },
    });
    return mapCandidate(updated);
  }

  // approve or approve_with_edits — create bank item
  const questionText   = body.questionText  ?? candidate.questionText;
  const correctAnswer  = body.correctAnswer ?? candidate.correctAnswer;
  const hint           = body.hint          ?? candidate.hint;
  const choices        = body.choices       ?? candidate.choices;

  let bankItemId: string;

  await db.$transaction(async (tx) => {
    const bankItem = await tx.questionBankItem.create({
      data: {
        topicId:               candidate.topicId,
        gradeId:               candidate.gradeId,
        skillId:               candidate.skillId,
        questionText,
        format:                candidate.format,
        difficulty:            candidate.difficulty,
        correctAnswer,
        hint,
        choices:               (choices as Prisma.InputJsonValue | null | undefined) ?? Prisma.DbNull,
        source:                "AI_GENERATED",
        reviewStatus:          "APPROVED",
        isActive:              true,
        modelUsed:             candidate.modelUsed,
        blueprintId:           candidate.blueprintId,
        promptTemplateVersion: candidate.promptTemplateSlug,
        validatorSummary: {
          passed: candidate.validatorPassed,
          errors: Array.isArray(candidate.validatorErrors) ? candidate.validatorErrors : [],
        },
      },
    });

    bankItemId = bankItem.id;

    await tx.questionCandidate.update({
      where: { id },
      data:  {
        candidateStatus: "APPROVED",
        reviewedAt:      now,
        reviewedBy:      body.reviewedBy ?? null,
        bankItemId:      bankItem.id,
      },
    });
  });

  const updated = await db.questionCandidate.findUnique({
    where:   { id },
    include: {
      topic: { select: { name: true } },
      grade: { select: { level: true } },
      skill: { select: { name: true } },
    },
  });
  return updated ? mapCandidate(updated) : null;
}

// ── Save AI-generated candidates to review queue ──────────────────────────────

export interface SaveCandidatesInput {
  topicId:        string;
  gradeId:        string;
  skillId?:       string;
  items: Array<{
    questionText:    string;
    format:          QuestionFormat;
    difficulty:      DifficultyLevel;
    correctAnswer:   string;
    hint?:           string;
    choices?:        AnswerChoice[];
    validatorPassed: boolean;
    validatorErrors: string[];
    modelUsed?:      string;
    blueprintId?:    string;
    blueprintVersion?: string;
    promptTemplateSlug?: string;
  }>;
}

export async function saveCandidates(input: SaveCandidatesInput): Promise<number> {
  const { topicId, gradeId, skillId, items } = input;
  const result = await db.questionCandidate.createMany({
    data: items.map((item) => ({
      topicId,
      gradeId,
      skillId:             skillId ?? null,
      questionText:        item.questionText,
      format:              item.format.toUpperCase() as never,
      difficulty:          item.difficulty.toUpperCase() as never,
      correctAnswer:       item.correctAnswer,
      hint:                item.hint ?? null,
      choices:             (item.choices as Prisma.InputJsonValue | undefined) ?? Prisma.DbNull,
      validatorPassed:     item.validatorPassed,
      validatorErrors:     item.validatorErrors,
      modelUsed:           item.modelUsed ?? null,
      blueprintId:         item.blueprintId ?? null,
      blueprintVersion:    item.blueprintVersion ?? null,
      promptTemplateSlug:  item.promptTemplateSlug ?? null,
      candidateStatus:     "PENDING_REVIEW",
    })),
  });
  return result.count;
}

// ── Internal mapper ───────────────────────────────────────────────────────────

type CandidateWithRelations = Awaited<ReturnType<typeof db.questionCandidate.findMany>>[0] & {
  topic: { name: string };
  grade: { level: number };
  skill: { name: string } | null;
};

function mapCandidate(r: CandidateWithRelations): QuestionCandidateRow {
  return {
    id:                 r.id,
    topicId:            r.topicId,
    topicName:          r.topic.name,
    gradeId:            r.gradeId,
    gradeLevel:         r.grade.level,
    skillId:            r.skillId,
    skillName:          r.skill?.name ?? null,
    questionText:       r.questionText,
    format:             r.format.toLowerCase() as QuestionFormat,
    difficulty:         r.difficulty.toLowerCase() as DifficultyLevel,
    correctAnswer:      r.correctAnswer,
    hint:               r.hint,
    choices:            r.choices as AnswerChoice[] | null,
    modelUsed:          r.modelUsed,
    blueprintId:        r.blueprintId,
    blueprintVersion:   r.blueprintVersion,
    promptTemplateSlug: r.promptTemplateSlug,
    validatorPassed:    r.validatorPassed,
    validatorErrors:    Array.isArray(r.validatorErrors) ? (r.validatorErrors as string[]) : [],
    candidateStatus:    fromCandidateStatus(r.candidateStatus),
    reviewedAt:         r.reviewedAt?.toISOString() ?? null,
    reviewedBy:         r.reviewedBy,
    bankItemId:         r.bankItemId,
    createdAt:          r.createdAt.toISOString(),
  };
}
