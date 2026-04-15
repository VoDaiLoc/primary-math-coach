/**
 * src/lib/db-mappers.ts
 *
 * Converts Prisma model records → domain types (src/types/domain.ts).
 * Requires `npx prisma generate` before this file will compile.
 *
 * Usage pattern in route handlers:
 *   import { mapGrade, mapStudent, mapExamResult } from "@/lib/db-mappers"
 */

import type { Prisma } from "@prisma/client";
import type {
  Grade,
  Student,
  StudentStats,
  CurriculumTopic,
  QuestionBlueprint,
  ValidatorRule,
  PromptTemplate,
  SkillProgress,
  HistoryEntry,
  ExamResult,
  WrongAnswerDetail,
  AnswerChoice,
} from "@/types/domain";
import type {
  DifficultyLevel,
  QuestionFormat,
  MasteryStatus,
  TopicStatus,
} from "@/types/enums";

// ── Enum converters ────────────────────────────────────────────────────────────
// Prisma enums are UPPERCASE; domain types use lowercase strings.
// These helpers make the conversion explicit and type-safe.

export function toDifficultyLevel(val: string): DifficultyLevel {
  return val.toLowerCase() as DifficultyLevel;
}

export function toQuestionFormat(val: string): QuestionFormat {
  return val.toLowerCase() as QuestionFormat;
}

export function toTopicStatus(val: string): TopicStatus {
  return val.toLowerCase() as TopicStatus;
}

export function toMasteryStatus(val: string): MasteryStatus {
  return val.toLowerCase() as MasteryStatus;
}

// ── Prisma payload types ───────────────────────────────────────────────────────
// Declare the exact Prisma query shapes that each mapper expects.
// These are what you'll get back from `prisma.model.findUnique({ include: {...} })`.

type PrismaGrade = Prisma.GradeGetPayload<Record<string, never>>;

type PrismaStudentWithGrade = Prisma.StudentGetPayload<{
  include: { grade: true };
}>;

type PrismaTopic = Prisma.CurriculumTopicGetPayload<{
  include: { _count: { select: { skills: true } } };
}>;

type PrismaBlueprint = Prisma.QuestionBlueprintGetPayload<Record<string, never>>;

type PrismaValidatorRule = Prisma.ValidatorRuleGetPayload<Record<string, never>>;

type PrismaPromptTemplate = Prisma.PromptTemplateGetPayload<Record<string, never>>;

type PrismaProgress = Prisma.LearningProgressGetPayload<{
  include: { topic: true };
}>;

type PrismaSubmissionFull = Prisma.SubmissionGetPayload<{
  include: {
    exam: { include: { topic: true } };
    answers: { include: { examItem: true } };
  };
}>;

type PrismaSubmissionForHistory = Prisma.SubmissionGetPayload<{
  include: { exam: { include: { topic: true } } };
}>;

// ── Grade ──────────────────────────────────────────────────────────────────────

export function mapGrade(g: PrismaGrade): Grade {
  return {
    id:          g.id,
    level:       g.level,
    displayName: g.displayName,
    isPublic:    g.isPublic,
    topicCount:  0, // populate separately from topic count query if needed
  };
}

/** Use this when you've loaded topicCount separately. */
export function mapGradeWithCount(g: PrismaGrade, topicCount: number): Grade {
  return { ...mapGrade(g), topicCount };
}

// ── Student ────────────────────────────────────────────────────────────────────

export function mapStudent(s: PrismaStudentWithGrade): Student {
  return {
    id:         s.id,
    name:       s.name,
    gradeLevel: s.grade.level,
    gradeName:  s.grade.displayName,
    email:      "", // include User relation to populate
    schoolName: s.schoolName ?? "",
    schoolYear: s.schoolYear,
  };
}

/** Compute StudentStats from raw submission data. */
export function computeStudentStats(
  studentId: string,
  submissions: Array<{ accuracy: number }>,
): StudentStats {
  const total    = submissions.length;
  const avgAcc   = total === 0
    ? 0
    : Math.round(submissions.reduce((s, r) => s + r.accuracy, 0) / total);
  return {
    studentId,
    totalExams:       total,
    averageAccuracy:  avgAcc,
  };
}

// ── CurriculumTopic ────────────────────────────────────────────────────────────

export function mapTopic(t: PrismaTopic): CurriculumTopic {
  return {
    id:           t.id,
    code:         t.code,
    gradeId:      t.gradeId,
    gradeLevel:   0,       // populate by joining Grade when needed
    name:         t.name,
    description:  t.description ?? "",
    status:       toTopicStatus(t.status),
    skillCount:   t._count.skills,
    questionCount:0,       // populate from ExamItem count if needed
    displayOrder: t.displayOrder,
  };
}

/** Simpler mapper when you already know gradeLevel and question count. */
export function mapTopicFull(
  t: Prisma.CurriculumTopicGetPayload<Record<string, never>>,
  gradeLevel: number,
  skillCount: number,
  questionCount: number,
): CurriculumTopic {
  return {
    id:           t.id,
    code:         t.code,
    gradeId:      t.gradeId,
    gradeLevel,
    name:         t.name,
    description:  t.description ?? "",
    status:       toTopicStatus(t.status),
    skillCount,
    questionCount,
    displayOrder: t.displayOrder,
  };
}

// ── QuestionBlueprint ──────────────────────────────────────────────────────────

export function mapBlueprint(b: PrismaBlueprint): QuestionBlueprint {
  return {
    id:             b.id,
    topicId:        b.topicId,
    skillId:        b.skillId ?? null,
    name:           b.name,
    questionFormat: toQuestionFormat(b.questionFormat),
    version:        b.version,
    isEnabled:      b.isEnabled,
    easyPercent:    b.easyPercent,
    mediumPercent:  b.mediumPercent,
    hardPercent:    b.hardPercent,
    constraints:    (b.constraints as Record<string, unknown> | null) ?? null,
  };
}

// ── ValidatorRule ──────────────────────────────────────────────────────────────

export function mapValidatorRule(r: PrismaValidatorRule): ValidatorRule {
  return {
    id:          r.id,
    name:        r.name,
    description: r.description,
    isActive:    r.isActive,
    scope:       r.scope,
    config:      (r.config as Record<string, unknown> | null) ?? null,
  };
}

// ── PromptTemplate ─────────────────────────────────────────────────────────────

export function mapPromptTemplate(t: PrismaPromptTemplate): PromptTemplate {
  return {
    id:          t.id,
    name:        t.name,
    version:     t.version,
    modelTarget: t.modelTarget,
    template:    t.template,
  };
}

// ── SkillProgress (from LearningProgress row) ──────────────────────────────────

export function mapSkillProgress(p: PrismaProgress): SkillProgress {
  return {
    topicId:        p.topicId,
    topicName:      p.topic.name,
    accuracy:       Math.round(p.accuracy),
    sessionCount:   p.sessionCount,
    totalQuestions: p.totalQuestions,
  };
}

// ── HistoryEntry (from Submission) ─────────────────────────────────────────────

export function mapHistoryEntry(s: PrismaSubmissionForHistory): HistoryEntry {
  const date = s.submittedAt ?? s.createdAt;
  return {
    id:            s.id,
    topicId:       s.exam.topicId,
    topicName:     s.exam.topic.name,
    date:          formatShortDate(date),
    score:         s.score,
    questionCount: s.totalQuestions,
  };
}

// ── ExamResult (from Submission with answers) ──────────────────────────────────

export function mapExamResult(s: PrismaSubmissionFull): ExamResult {
  const wrongAnswers: WrongAnswerDetail[] = s.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionId:    a.examItemId,
      questionText:  a.examItem.questionText,
      givenAnswer:   a.givenAnswer,
      correctAnswer: a.examItem.correctAnswer,
      hint:          a.examItem.hint ?? undefined,
    }));

  return {
    examId:          s.examId,
    topicName:       s.exam.topic.name,
    score:           s.score,
    totalQuestions:  s.totalQuestions,
    accuracy:        Math.round(s.accuracy),
    durationSeconds: s.durationSeconds ?? 0,
    wrongAnswers,
  };
}

// ── AnswerChoice (from ExamItem.choices JSON) ──────────────────────────────────

export function parseChoices(raw: Prisma.JsonValue): AnswerChoice[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<{ id: string; text: string; isCorrect: boolean }>)
    .map((c) => ({ id: c.id, text: c.text, isCorrect: c.isCorrect }));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatShortDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}
