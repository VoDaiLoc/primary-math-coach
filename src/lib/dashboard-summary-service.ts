/**
 * src/lib/dashboard-summary-service.ts
 *
 * Builds the full data payload for the parent dashboard screen.
 * Called directly from the route handler — keeps that handler thin.
 *
 * No auth yet: studentId is passed in (demo-session hardcodes it).
 */

import { db } from "@/lib/db";
import { mapStudent } from "@/lib/db-mappers";
import { buildRecommendations, buildWeeklyStats } from "@/lib/recommendation-service";
import type { DashboardSummaryResponse, DashboardStats, DashboardHistoryEntry } from "@/types/api";
import type { SkillProgress } from "@/types/domain";
import type { MasteryStatus } from "@/types/enums";

// ── Public entry point ─────────────────────────────────────────────────────────

export async function buildDashboardSummary(
  studentId: string,
): Promise<DashboardSummaryResponse> {
  // 1. Student + grade
  const studentRow = await db.student.findUniqueOrThrow({
    where:   { id: studentId },
    include: { grade: true },
  });

  const student = mapStudent(studentRow);

  // 2. All graded submissions — for stats and history
  const submissionRows = await db.submission.findMany({
    where:   { studentId, status: "GRADED" },
    orderBy: { submittedAt: "desc" },
    include: { exam: { include: { topic: true } } },
  });

  // 3. LearningProgress — for topic progress breakdown
  const progressRows = await db.learningProgress.findMany({
    where:   { studentId },
    include: { topic: true },
    orderBy: { accuracy: "asc" }, // weakest first
  });

  // 4. Weekly stats + recommendations (reused from recommendation-service)
  const [weeklyStats, recommendations] = await Promise.all([
    buildWeeklyStats(studentId),
    buildRecommendations(studentId, studentRow.gradeId),
  ]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalQuestionsAnswered = submissionRows.reduce((s, r) => s + r.totalQuestions, 0);
  const totalCorrectAnswers    = submissionRows.reduce((s, r) => s + r.score, 0);
  const avgAccuracy = submissionRows.length === 0
    ? 0
    : Math.round(submissionRows.reduce((s, r) => s + r.accuracy, 0) / submissionRows.length);
  const avgDuration = submissionRows.length === 0
    ? 0
    : Math.round(submissionRows.reduce((s, r) => s + (r.durationSeconds ?? 0), 0) / submissionRows.length);

  const stats: DashboardStats = {
    totalSubmissions:       submissionRows.length,
    averageAccuracy:        avgAccuracy,
    totalQuestionsAnswered,
    totalCorrectAnswers,
    trackedTopicsCount:     progressRows.length,
    averageDurationSeconds: avgDuration,
  };

  // ── Recent history (last 10) ─────────────────────────────────────────────────
  const recentHistory: DashboardHistoryEntry[] = submissionRows.slice(0, 10).map((sub) => ({
    id:            sub.id,
    topicId:       sub.exam.topicId,
    topicName:     sub.exam.topic.name,
    date:          formatDate(sub.submittedAt ?? sub.createdAt),
    score:         sub.score,
    questionCount: sub.totalQuestions,
    submissionId:  sub.id,
    accuracy:      sub.accuracy,
    durationSeconds: sub.durationSeconds ?? 0,
    submittedAt:   (sub.submittedAt ?? sub.createdAt).toISOString(),
  }));

  // ── Topic progress from LearningProgress ─────────────────────────────────────
  const topicProgress: SkillProgress[] = progressRows.map((p) => ({
    topicId:       p.topicId,
    topicName:     p.topic.name,
    accuracy:      Math.round(p.accuracy),
    sessionCount:  p.sessionCount,
    totalQuestions: p.totalQuestions,
    mastery:       p.mastery.toLowerCase() as MasteryStatus,
  }));

  const strongTopics = topicProgress.filter((t) => t.accuracy >= 80);
  const weakTopics   = topicProgress.filter((t) => t.accuracy < 60);

  return {
    student,
    stats,
    weeklyStats,
    topicProgress,
    strongTopics,
    weakTopics,
    recentHistory,
    recommendations,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}
