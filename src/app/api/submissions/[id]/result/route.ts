/**
 * GET /api/submissions/[id]/result
 *
 * Returns the full result for a graded submission, including wrong-answer details,
 * rule-based recommendations, and optional AI-generated feedback.
 *
 * AI feedback is generated for up to MAX_AI_WRONG answers. If AI is not
 * configured or fails, safe fallbacks are used — the route never fails due to AI.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api-response";
import { mapExamResultResponse } from "@/lib/practice-mappers";
import { buildRecommendations } from "@/lib/recommendation-service";
import {
  generateWrongAnswerFeedback,
  generateEncouragementMessage,
} from "@/lib/ai-feedback-service";

export const dynamic = "force-dynamic";

/** Max number of wrong answers that get AI feedback (to keep latency bounded). */
const MAX_AI_WRONG = 3;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const submission = await db.submission.findUnique({
      where: { id },
      include: {
        exam: { include: { topic: true, grade: true } },
        answers: { include: { examItem: true } },
      },
    });

    if (!submission) return notFound("Không tìm thấy kết quả bài làm.");

    const [nextRecommendations, base] = await Promise.all([
      buildRecommendations(submission.studentId, submission.exam.gradeId),
      Promise.resolve(mapExamResultResponse(submission)),
    ]);

    const gradeLevel = submission.exam.grade.level;
    const topicName  = submission.exam.topic.name;

    // ── AI enrichment (best-effort, never throws) ──────────────────────────────

    // 1. Per-wrong-answer feedback (parallel, capped at MAX_AI_WRONG)
    const wrongWithAI = await Promise.all(
      base.wrongAnswers.map(async (wa, idx) => {
        if (idx >= MAX_AI_WRONG) {
          return { ...wa, aiExplanation: null, aiFriendlyHint: null };
        }
        const feedback = await generateWrongAnswerFeedback({
          questionText:  wa.questionText,
          givenAnswer:   wa.givenAnswer,
          correctAnswer: wa.correctAnswer,
          hint:          wa.hint,
          topicName,
          gradeLevel,
        });
        return {
          ...wa,
          aiExplanation:  feedback.shortExplanation,
          aiFriendlyHint: feedback.friendlyHint,
        };
      }),
    );

    // 2. Session-level encouragement
    const { encouragementMessage } = await generateEncouragementMessage({
      score:          submission.score,
      totalQuestions: submission.totalQuestions,
      topicName,
      gradeLevel,
    });

    return ok({
      ...base,
      wrongAnswers:        wrongWithAI,
      nextRecommendations,
      encouragementMessage,
    });
  } catch (err) {
    console.error(`[GET /api/submissions/${id}/result]`, err);
    return serverError("Không thể tải kết quả bài làm.");
  }
}


