/**
 * src/lib/recommendation-service.ts
 *
 * Rule-based recommendation engine. No AI — deterministic logic on
 * LearningProgress + CurriculumTopic data.
 *
 * Shared by home-summary-service and dashboard-summary-service.
 * Each caller passes (studentId, gradeId) and gets back up to 3 recs.
 *
 * Rules (evaluated in order, max 3 recommendations returned):
 *   1. No submissions yet  → introduce first topic          (easy,   5 câu)
 *   2. accuracy < 50       → repeat topic                  (easy,   5 câu, max 2)
 *   3. accuracy 50–79      → continue topic                (medium, 10 câu, max 2)
 *   4. accuracy ≥ 80       → advance to next topic OR      (easy,   5 câu)
 *                            level-up difficulty on same   (hard,  10 câu)
 *   5. Unstarted topic     → introduce it                  (easy,   5 câu)
 *   6. Fallback            → first active topic            (easy,  10 câu)
 */

import { db } from "@/lib/db";
import type { Recommendation, WeeklyStats } from "@/types/domain";
import type { DifficultyLevel, QuestionFormat } from "@/types/enums";

export type ReasonCode =
  | "first_session"   // no submissions yet
  | "needs_practice"  // accuracy < 50
  | "keep_going"      // accuracy 50–79
  | "level_up"        // accuracy >= 80, same topic harder
  | "next_topic"      // accuracy >= 80, advance to next topic
  | "new_topic"       // unstarted topic
  | "fallback";       // catch-all

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

// ── Public exports ─────────────────────────────────────────────────────────────

export async function buildRecommendations(
  studentId: string,
  gradeId: string,
): Promise<Recommendation[]> {
  const [progressList, activeTopics] = await Promise.all([
    db.learningProgress.findMany({
      where:   { studentId },
      include: { topic: true },
      orderBy: { accuracy: "asc" }, // weakest-first so rules 2–3 process priority correctly
    }),
    db.curriculumTopic.findMany({
      where:   { gradeId, status: "ACTIVE" },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  const recs: Recommendation[] = [];
  const learnedIds = new Set(progressList.map((p) => p.topicId));

  // ── Rule 1: first session ever ──────────────────────────────────────────────
  if (progressList.length === 0) {
    const first = activeTopics[0];
    if (first) {
      recs.push(
        makeRec("first_session", first.id, first.name,
          `${first.name} — 5 câu`,
          "Bài luyện đầu tiên — dễ và không giới hạn thời gian!",
          "easy", "mcq", 5),
      );
    }
    return recs;
  }

  // ── Rule 2: accuracy < 50 → needs_practice ─────────────────────────────────
  for (const p of progressList.filter((x) => x.accuracy < 50).slice(0, 2)) {
    recs.push(
      makeRec("needs_practice", p.topicId, p.topic.name,
        `${p.topic.name} — Ôn tập (5 câu)`,
        `Độ chính xác ${Math.round(p.accuracy)}% — Thử lại từ mức dễ nhé!`,
        "easy", "mcq", 5),
    );
  }

  // ── Rule 3: accuracy 50–79 → keep_going ────────────────────────────────────
  if (recs.length < 3) {
    for (const p of progressList.filter((x) => x.accuracy >= 50 && x.accuracy < 80).slice(0, 2)) {
      if (recs.length >= 3) break;
      recs.push(
        makeRec("keep_going", p.topicId, p.topic.name,
          `${p.topic.name} — Tiếp tục (10 câu)`,
          `Độ chính xác ${Math.round(p.accuracy)}% — Đang tiến bộ, giữ đà nhé!`,
          "medium", "mcq", 10),
      );
    }
  }

  // ── Rule 4: accuracy ≥ 80 → level_up or next_topic ─────────────────────────
  if (recs.length < 3) {
    for (const p of progressList.filter((x) => x.accuracy >= 80)) {
      if (recs.length >= 3) break;
      const idx = activeTopics.findIndex((t) => t.id === p.topicId);
      const next = activeTopics[idx + 1];
      if (next && !learnedIds.has(next.id)) {
        recs.push(
          makeRec("next_topic", next.id, next.name,
            `${next.name} — Chủ đề tiếp theo (5 câu)`,
            `Bạn đã giỏi "${p.topic.name}" — thử chủ đề mới nhé!`,
            "easy", "mcq", 5),
        );
      } else {
        recs.push(
          makeRec("level_up", p.topicId, p.topic.name,
            `${p.topic.name} — Thử thách (10 câu)`,
            `Độ chính xác ${Math.round(p.accuracy)}% — Sẵn sàng tăng độ khó?`,
            "hard", "mcq", 10),
        );
      }
    }
  }

  // ── Rule 5: unstarted topic ─────────────────────────────────────────────────
  if (recs.length < 3) {
    const nextNew = activeTopics.find((t) => !learnedIds.has(t.id));
    if (nextNew) {
      recs.push(
        makeRec("new_topic", nextNew.id, nextNew.name,
          `${nextNew.name} — Chủ đề mới (5 câu)`,
          "Chủ đề bạn chưa thử — hãy bắt đầu nhé!",
          "easy", "mcq", 5),
      );
    }
  }

  // ── Rule 6: fallback ────────────────────────────────────────────────────────
  if (recs.length === 0 && activeTopics[0]) {
    recs.push(
      makeRec("fallback", activeTopics[0].id, activeTopics[0].name,
        `${activeTopics[0].name} — 10 câu`,
        "Tiếp tục luyện tập để cải thiện điểm số!",
        "easy", "mcq", 10),
    );
  }

  return recs.slice(0, 3);
}

/**
 * Last 7 calendar days grouped by day-of-week.
 * Exported so both home-summary-service and dashboard-summary-service
 * can reuse without duplicating the query.
 */
export async function buildWeeklyStats(studentId: string): Promise<WeeklyStats[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const subs = await db.submission.findMany({
    where: {
      studentId,
      status:      "GRADED",
      submittedAt: { gte: sevenDaysAgo },
    },
    select: { submittedAt: true, accuracy: true },
  });

  const dayMap = new Map<number, number[]>();
  for (const sub of subs) {
    const dow = (sub.submittedAt ?? now).getDay();
    const bucket = dayMap.get(dow) ?? [];
    bucket.push(sub.accuracy);
    dayMap.set(dow, bucket);
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const accuracies = dayMap.get(dow) ?? [];
    return {
      label:        DAY_LABELS[dow],
      sessionCount: accuracies.length,
      accuracy:
        accuracies.length === 0
          ? 0
          : Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length),
    };
  });
}

// ── Private helpers ─────────────────────────────────────────────────────────────

function makeRec(
  reasonCode: ReasonCode,
  topicId: string,
  topicName: string,
  title: string,
  description: string,
  difficulty: DifficultyLevel,
  format: QuestionFormat,
  questionCount: number,
): Recommendation {
  return {
    id: `rec-${reasonCode}-${topicId}`,
    topicId,
    title,
    description,
    difficulty,
    format,
    questionCount,
    reasonCode,
    // topicName is not in Recommendation domain type — title/description carry it
  };
}
