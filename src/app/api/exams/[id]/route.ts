/**
 * GET /api/exams/[id]
 *
 * Returns all items for an exam as an ExamSessionResponse.
 * Used by the practice/session page to populate the question view.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api-response";
import { mapExamSessionItem } from "@/lib/practice-mappers";
import type { GetExamSessionResponse } from "@/types/api";
import type { ExamMode } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const exam = await db.exam.findUnique({
      where: { id },
      include: {
        topic: true,
        grade: true,
        items: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!exam) return notFound("Không tìm thấy bài luyện tập.");

    const mode: ExamMode = exam.mode === "TIMED_EXAM" ? "timed_exam" : "practice";

    const body: GetExamSessionResponse = {
      examId:          exam.id,
      topicName:       exam.topic.name,
      gradeName:       exam.grade.displayName,
      questionCount:   exam.questionCount,
      mode,
      timeLimitMinutes: exam.timeLimitMinutes ?? undefined,
      items:           exam.items.map(mapExamSessionItem),
    };

    return ok(body);
  } catch (err) {
    console.error(`[GET /api/exams/${id}]`, err);
    return serverError("Không thể tải bài luyện tập.");
  }
}

