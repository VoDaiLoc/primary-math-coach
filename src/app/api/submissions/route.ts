/**
 * POST /api/submissions
 *
 * Grades a completed exam session:
 *  1. Loads the exam items from DB.
 *  2. Grades each answer (MCQ: isCorrect flag on choice; FILLIN: case-insensitive compare).
 *  3. Creates Submission + SubmissionAnswer rows in a transaction.
 *  4. Upserts LearningProgress and recalculates cumulative accuracy.
 *  5. Returns { submissionId, score, totalQuestions, accuracy }.
 *
 * Accepts unanswered items: items not in `answers` are counted as wrong.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api-response";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import type { SubmitExamRequest, SubmitExamResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: SubmitExamRequest;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { examId, studentId, answers, durationSeconds } = body;

  if (!examId)   return badRequest("examId không được để trống.");
  if (!studentId || studentId !== DEMO_STUDENT_ID) return badRequest("studentId không hợp lệ.");
  if (!Array.isArray(answers)) return badRequest("answers phải là mảng.");

  // ── Load exam + items ───────────────────────────────────────────────────────
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { items: true },
  });
  if (!exam) return notFound("Không tìm thấy bài luyện tập.");

  // ── Build answered-item map ────────────────────────────────────────────────
  // answers from FE may not cover every item (timed_exam can time out mid-way)
  const answerMap = new Map(answers.map((a) => [a.examItemId, a.givenAnswer]));

  // ── Grade all items in the exam ────────────────────────────────────────────
  type GradedAnswer = { examItemId: string; givenAnswer: string; isCorrect: boolean };

  const gradedAnswers: GradedAnswer[] = exam.items.map((item) => {
    const givenAnswer = answerMap.get(item.id) ?? ""; // unanswered = empty string

    let isCorrect: boolean;
    if (!givenAnswer) {
      isCorrect = false;
    } else if (item.questionFormat === "MCQ") {
      const choices = Array.isArray(item.choices)
        ? (item.choices as Array<{ id: string; text: string; isCorrect: boolean }>)
        : [];
      isCorrect = choices.find((c) => c.id === givenAnswer)?.isCorrect ?? false;
    } else {
      // FILLIN — case-insensitive, trimmed
      isCorrect = item.correctAnswer.trim().toLowerCase() === givenAnswer.trim().toLowerCase();
    }

    return { examItemId: item.id, givenAnswer, isCorrect };
  });

  const score    = gradedAnswers.filter((a) => a.isCorrect).length;
  const total    = exam.items.length;
  const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);

  // ── Persist in transaction ──────────────────────────────────────────────────
  try {
    const submission = await db.$transaction(async (tx) => {
      // 1. Create submission
      const sub = await tx.submission.create({
        data: {
          examId,
          studentId,
          totalQuestions:  total,
          score,
          accuracy,
          durationSeconds: Math.max(0, Math.round(durationSeconds ?? 0)),
          status:          "GRADED",
          submittedAt:     new Date(),
        },
      });

      // 2. Save per-item answers
      await tx.submissionAnswer.createMany({
        data: gradedAnswers.map((a) => ({
          submissionId: sub.id,
          examItemId:   a.examItemId,
          givenAnswer:  a.givenAnswer,
          isCorrect:    a.isCorrect,
        })),
      });

      // 3. Upsert LearningProgress — increment raw counts first
      await tx.learningProgress.upsert({
        where:  { studentId_topicId: { studentId, topicId: exam.topicId } },
        create: {
          studentId,
          topicId:         exam.topicId,
          sessionCount:    1,
          totalQuestions:  total,
          correctCount:    score,
          accuracy,
          mastery:         accuracy >= 80 ? "STRONG" : accuracy >= 50 ? "DEVELOPING" : "WEAK",
          lastPracticedAt: new Date(),
        },
        update: {
          sessionCount:    { increment: 1 },
          totalQuestions:  { increment: total },
          correctCount:    { increment: score },
          lastPracticedAt: new Date(),
        },
      });

      // 4. Read back cumulative counts and recompute accuracy + mastery
      const prog = await tx.learningProgress.findUniqueOrThrow({
        where: { studentId_topicId: { studentId, topicId: exam.topicId } },
      });
      const cumAccuracy = Math.round((prog.correctCount / prog.totalQuestions) * 100);
      const cumMastery  = cumAccuracy >= 80 ? "STRONG" : cumAccuracy >= 50 ? "DEVELOPING" : "WEAK";

      await tx.learningProgress.update({
        where: { studentId_topicId: { studentId, topicId: exam.topicId } },
        data:  { accuracy: cumAccuracy, mastery: cumMastery },
      });

      return sub;
    });

    return ok<SubmitExamResponse>({
      submissionId:   submission.id,
      score,
      totalQuestions: total,
      accuracy,
    }, 201);
  } catch (err) {
    console.error("[POST /api/submissions]", err);
    return serverError("Không thể lưu kết quả bài làm.");
  }
}

