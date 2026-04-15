/**
 * src/lib/student-profile-service.ts
 *
 * Builds and updates the student profile payload.
 * Route handlers stay thin — all DB logic lives here.
 */

import { db } from "@/lib/db";
import type { StudentProfileResponse, UpdateStudentProfileRequest } from "@/types/api";
import type { SkillProgress, HistoryEntry } from "@/types/domain";
import type { MasteryStatus } from "@/types/enums";

// ── GET ────────────────────────────────────────────────────────────────────────

export async function getStudentProfile(studentId: string): Promise<StudentProfileResponse> {
  const [studentRow, submissionRows, progressRows, focusTopic] = await Promise.all([
    db.student.findUniqueOrThrow({
      where:   { id: studentId },
      include: { grade: true },
    }),
    db.submission.findMany({
      where:   { studentId, status: "GRADED" },
      orderBy: { submittedAt: "desc" },
      include: { exam: { include: { topic: true } } },
    }),
    db.learningProgress.findMany({
      where:   { studentId },
      include: { topic: true },
      orderBy: { accuracy: "asc" },
    }),
    // Resolve currentFocusTopicId to a name in parallel
    studentRow_focusTopic(studentId),
  ]);

  const totalSubmissions = submissionRows.length;
  const averageAccuracy  = totalSubmissions === 0
    ? 0
    : Math.round(submissionRows.reduce((s, r) => s + r.accuracy, 0) / totalSubmissions);

  // Earliest submission date = "startedAt"
  const earliest     = submissionRows.length > 0
    ? submissionRows[submissionRows.length - 1]
    : null;
  const startedAt    = earliest?.submittedAt?.toISOString() ?? null;

  const skillProgress: SkillProgress[] = progressRows.map((p) => ({
    topicId:        p.topicId,
    topicName:      p.topic.name,
    accuracy:       Math.round(p.accuracy),
    sessionCount:   p.sessionCount,
    totalQuestions: p.totalQuestions,
    mastery:        p.mastery.toLowerCase() as MasteryStatus,
  }));

  const recentHistory: HistoryEntry[] = submissionRows.slice(0, 5).map((sub) => ({
    id:            sub.id,
    topicId:       sub.exam.topicId,
    topicName:     sub.exam.topic.name,
    date:          formatDate(sub.submittedAt ?? sub.createdAt),
    score:         sub.score,
    questionCount: sub.totalQuestions,
  }));

  return {
    studentId:             studentRow.id,
    name:                  studentRow.name,
    gradeName:             studentRow.grade.displayName,
    gradeId:               studentRow.gradeId,
    schoolName:            studentRow.schoolName ?? "",
    schoolYear:            studentRow.schoolYear,
    currentFocusTopicId:   studentRow.currentFocusTopicId ?? null,
    currentFocusTopicName: focusTopic?.name ?? null,
    weeklyGoalSessions:    studentRow.weeklyGoalSessions ?? null,
    currentLevel:          studentRow.currentLevel ?? null,
    startedAt,
    averageAccuracy,
    totalSubmissions,
    skillProgress,
    recentHistory,
  };
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function updateStudentProfile(
  studentId: string,
  body: UpdateStudentProfileRequest,
): Promise<{ updatedAt: Date }> {
  // Validate currentFocusTopicId exists if provided
  if (body.currentFocusTopicId) {
    const exists = await db.curriculumTopic.findUnique({
      where:  { id: body.currentFocusTopicId },
      select: { id: true },
    });
    if (!exists) throw new ValidationError("Chủ đề không tồn tại.");
  }

  const updated = await db.student.update({
    where: { id: studentId },
    data:  {
      ...(body.name             !== undefined && { name:                body.name.trim() }),
      ...(body.schoolName       !== undefined && { schoolName:          body.schoolName?.trim() ?? null }),
      ...(body.schoolYear       !== undefined && { schoolYear:          body.schoolYear.trim() }),
      ...(body.weeklyGoalSessions !== undefined && { weeklyGoalSessions: body.weeklyGoalSessions }),
      ...(body.currentFocusTopicId !== undefined && { currentFocusTopicId: body.currentFocusTopicId }),
      ...(body.currentLevel     !== undefined && { currentLevel:        body.currentLevel }),
    },
    select: { updatedAt: true },
  });

  return updated;
}

// ── Validation helper ──────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Input validation ───────────────────────────────────────────────────────────

export function validateUpdateBody(raw: unknown): UpdateStudentProfileRequest {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError("Request body phải là JSON object.");
  }
  const body = raw as Record<string, unknown>;
  const out: UpdateStudentProfileRequest = {};

  applyString(body, out, "name",       (v) => v.trim().length > 0, "name phải là chuỗi không rỗng.");
  applyNullableString(body, out, "schoolName");
  applyString(body, out, "schoolYear", (v) => v.trim().length > 0, "schoolYear phải là chuỗi không rỗng.");
  applyNullableString(body, out, "currentFocusTopicId");

  if ("weeklyGoalSessions" in body) {
    const v = body.weeklyGoalSessions;
    if (v !== null && (typeof v !== "number" || v < 1 || v > 30 || !Number.isInteger(v))) {
      throw new ValidationError("weeklyGoalSessions phải là số nguyên 1–30 hoặc null.");
    }
    out.weeklyGoalSessions = v as number | null;
  }

  if ("currentLevel" in body) {
    const v = body.currentLevel;
    if (v !== null && v !== "beginner" && v !== "intermediate" && v !== "advanced") {
      throw new ValidationError('currentLevel phải là "beginner", "intermediate", "advanced" hoặc null.');
    }
    out.currentLevel = v as string | null;
  }

  return out;
}

function applyString(
  body: Record<string, unknown>,
  out: UpdateStudentProfileRequest,
  key: keyof UpdateStudentProfileRequest,
  valid: (v: string) => boolean,
  errMsg: string,
) {
  if (!(key in body)) return;
  const v = body[key];
  if (typeof v !== "string" || !valid(v)) throw new ValidationError(errMsg);
  (out as Record<string, unknown>)[key] = v;
}

function applyNullableString(
  body: Record<string, unknown>,
  out: UpdateStudentProfileRequest,
  key: keyof UpdateStudentProfileRequest,
) {
  if (!(key in body)) return;
  const v = body[key];
  if (v !== null && typeof v !== "string") {
    throw new ValidationError(`${key} phải là string hoặc null.`);
  }
  (out as Record<string, unknown>)[key] = v;
}

// ── Private helpers ────────────────────────────────────────────────────────────

/** Fetch focus topic name separately to avoid a conditional join. */
async function studentRow_focusTopic(studentId: string) {
  const row = await db.student.findUnique({
    where:  { id: studentId },
    select: { currentFocusTopicId: true },
  });
  if (!row?.currentFocusTopicId) return null;
  return db.curriculumTopic.findUnique({
    where:  { id: row.currentFocusTopicId },
    select: { name: true },
  });
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}
