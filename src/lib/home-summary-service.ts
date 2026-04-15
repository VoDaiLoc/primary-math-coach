/**
 * src/lib/home-summary-service.ts
 *
 * Builds the full data payload for the home screen.
 * Called directly from the route handler — keeps the handler thin.
 *
 * No auth yet: studentId is passed in (demo-session hardcodes it).
 * When auth is added, replace the caller with a session-based lookup.
 */

import { db } from "@/lib/db";
import { computeStudentStats, mapStudent } from "@/lib/db-mappers";
import { buildRecommendations, buildWeeklyStats } from "@/lib/recommendation-service";
import type { HomeSummaryResponse } from "@/types/api";
import type { InProgressSession, HistoryEntry } from "@/types/domain";

// Vietnamese day-of-week labels (0 = Sunday)

// ── Public entry point ─────────────────────────────────────────────────────────

export async function buildHomeSummary(
  studentId: string,
): Promise<HomeSummaryResponse> {
  // 1. Student + grade (for name, gradeName, schoolYear, etc.)
  const studentRow = await db.student.findUniqueOrThrow({
    where:   { id: studentId },
    include: { grade: true },
  });

  // 2. All graded submissions — used for overall stats
  const allSubmissions = await db.submission.findMany({
    where:  { studentId, status: "GRADED" },
    select: { accuracy: true },
  });

  const student = mapStudent(studentRow);
  const stats   = computeStudentStats(studentId, allSubmissions);

  // 3. In-progress exam: created but no submission yet
  //    We show only the most recent one; older ones are silently abandoned.
  const pendingExam = await db.exam.findFirst({
    where: {
      studentId,
      submissions: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    include: { topic: true, grade: true },
  });

  const inProgress: InProgressSession | null = pendingExam
    ? {
        examId:       pendingExam.id,
        topicName:    pendingExam.topic.name,
        gradeName:    pendingExam.grade.displayName,
        answeredCount: 0, // no mid-session persistence yet
        totalCount:   pendingExam.questionCount,
      }
    : null;

  // 4. Recent history: last 5 graded submissions
  const recentSubmissions = await db.submission.findMany({
    where:   { studentId, status: "GRADED" },
    orderBy: { submittedAt: "desc" },
    take:    5,
    include: { exam: { include: { topic: true } } },
  });

  const recentHistory: HistoryEntry[] = recentSubmissions.map((sub) => ({
    id:            sub.id,
    topicId:       sub.exam.topicId,
    topicName:     sub.exam.topic.name,
    date:          formatDisplayDate(sub.submittedAt ?? sub.createdAt),
    score:         sub.score,
    questionCount: sub.totalQuestions,
  }));

  // 5. Rule-based recommendations from LearningProgress
  const recommendations = await buildRecommendations(
    studentId,
    studentRow.gradeId,
  );

  // 6. Weekly stats: sessions per calendar day over the last 7 days
  const weeklyStats = await buildWeeklyStats(studentId);

  return { student, stats, inProgress, recentHistory, recommendations, weeklyStats };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** "dd/MM" format for display. */
function formatDisplayDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}
