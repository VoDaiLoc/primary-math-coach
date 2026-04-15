/**
 * POST /api/exams
 *
 * Creates a new exam for the demo student:
 *  1. Validates the request body.
 *  2. Delegates to createExam() service (AI generation → validator → fallback → persist).
 *  3. Returns { examId, generatedBy, blueprintId, blueprintVersion }.
 *
 * The route is intentionally thin — all orchestration lives in create-exam-service.ts.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { createExam, InsufficientQuestionsError } from "@/lib/create-exam-service";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import type { CreateExamRequest, CreateExamResponse } from "@/types/api";
import type { DifficultyLevel, QuestionFormat, ExamMode } from "@/types/enums";

export const dynamic = "force-dynamic";

const VALID_DIFFICULTIES = new Set<DifficultyLevel>(["easy", "medium", "hard"]);
const VALID_FORMATS = new Set<QuestionFormat>(["mcq", "fillin"]);
const VALID_MODES = new Set<ExamMode>(["practice", "timed_exam"]);
const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 1;
const VALID_TIME_LIMITS = new Set([5, 10, 15, 20, 30]);

export async function POST(req: NextRequest) {
  let body: CreateExamRequest;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  const { studentId, topicId, questionCount, difficulty, format, mode, timeLimitMinutes } = body;

  if (!studentId || studentId !== DEMO_STUDENT_ID) {
    return badRequest("studentId không hợp lệ.");
  }
  if (!topicId) {
    return badRequest("topicId không được để trống.");
  }
  if (!VALID_DIFFICULTIES.has(difficulty)) {
    return badRequest("difficulty phải là easy, medium hoặc hard.");
  }
  if (!VALID_FORMATS.has(format)) {
    return badRequest("format phải là mcq hoặc fillin.");
  }
  if (!VALID_MODES.has(mode)) {
    return badRequest("mode phải là practice hoặc timed_exam.");
  }
  const count = Number(questionCount);
  if (!Number.isInteger(count) || count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
    return badRequest(`questionCount phải từ ${MIN_QUESTIONS} đến ${MAX_QUESTIONS}.`);
  }
  if (mode === "timed_exam") {
    if (!timeLimitMinutes || !VALID_TIME_LIMITS.has(timeLimitMinutes)) {
      return badRequest(`timeLimitMinutes phải là một trong: ${[...VALID_TIME_LIMITS].join(", ")}.`);
    }
  }

  // ── Verify topic exists and is active ─────────────────────────────────────
  const topic = await db.curriculumTopic.findUnique({ where: { id: topicId } });
  if (!topic) return notFound("Không tìm thấy chủ đề.");
  if (topic.status !== "ACTIVE") return badRequest("Chủ đề này chưa được mở.");

  // ── Delegate to service ────────────────────────────────────────────────────
  try {
    const result = await createExam({
      studentId, topicId, questionCount: count, difficulty, format, mode, timeLimitMinutes,
    });

    return ok<CreateExamResponse>(
      { examId: result.examId, generatedBy: result.generatedBy, blueprintId: null, blueprintVersion: null },
      201,
    );
  } catch (err) {
    if (err instanceof InsufficientQuestionsError) {
      return ok(
        { error: err.message, available: err.available, required: err.required },
        422,
      );
    }
    console.error("[POST /api/exams]", err);
    return serverError("Không thể tạo bài luyện tập.");
  }
}

