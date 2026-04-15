"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SectionCard } from "@/components/shared/SectionCard";
import { ProgressTracker } from "@/features/practice/components/ProgressTracker";
import { AnswerOptionsMCQ, AnswerOptionsFillin } from "@/features/practice/components/AnswerOptions";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import type { GetExamSessionResponse, SubmitExamRequest, SubmitExamResponse } from "@/types/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Inner component (reads search params) ─────────────────────────────────────

function SessionContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const examId       = searchParams.get("examId");

  const [exam, setExam]           = useState<GetExamSessionResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Answer state ───────────────────────────────────────────────────────────
  // answers: map of examItemId → givenAnswer (string)
  // Use both state (for render) and ref (for access inside timer callbacks).
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const answersRef              = useRef<Record<string, string>>({});

  function updateAnswer(itemId: string, value: string) {
    const next = { ...answersRef.current, [itemId]: value };
    answersRef.current = next;
    setAnswers(next);
  }

  const [currentIdx, setCurrentIdx]   = useState(0);
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // ── Countdown (timed_exam only) ──────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ── Fetch exam session ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!examId) {
      setFetchError("Không tìm thấy bài luyện tập. Vui lòng chọn lại.");
      setLoading(false);
      return;
    }

    fetch(`/api/exams/${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải bài luyện tập.");
        return res.json() as Promise<GetExamSessionResponse>;
      })
      .then((data) => {
        setExam(data);
        startTimeRef.current = Date.now();
        if (data.mode === "timed_exam" && data.timeLimitMinutes) {
          setTimeLeft(data.timeLimitMinutes * 60);
        }
      })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, [examId]);

  // ── Submit (stable ref so timer can call it without stale closure) ─────────
  const submitExam = useCallback(async () => {
    if (!exam || !examId || submitted || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const currentAnswers  = answersRef.current;

    const body: SubmitExamRequest = {
      examId,
      studentId: DEMO_STUDENT_ID,
      answers:   Object.entries(currentAnswers).map(([examItemId, givenAnswer]) => ({
        examItemId,
        givenAnswer,
      })),
      durationSeconds,
    };

    try {
      const res = await fetch("/api/submissions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Không thể lưu kết quả.");
      }

      const { submissionId }: SubmitExamResponse = await res.json();
      setSubmitted(true);
      router.push(`/practice/result?submissionId=${submissionId}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Lỗi kết nối.");
      setSubmitting(false);
    }
  }, [exam, examId, submitted, submitting, router]);

  // ── Countdown tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft <= 0) {
      submitExam();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted, submitExam]);

  // ── Loading / error screens ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto flex items-center justify-center h-48">
        <p className="text-sm text-neutral-400">Đang tải bài luyện tập...</p>
      </div>
    );
  }

  if (fetchError || !exam) {
    return (
      <div className="max-w-[680px] mx-auto">
        <SectionCard>
          <p className="text-sm text-danger font-medium">{fetchError ?? "Đã xảy ra lỗi."}</p>
          <button
            onClick={() => router.push("/practice/new")}
            className="mt-4 px-4 py-2 rounded-[8px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
          >
            Chọn bài khác
          </button>
        </SectionCard>
      </div>
    );
  }

  const question  = exam.items[currentIdx];
  const isMCQ     = question.questionFormat === "mcq";
  const isLast    = currentIdx + 1 >= exam.items.length;
  const isLowTime = timeLeft !== null && timeLeft <= 60;

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Header row: progress + optional countdown */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <ProgressTracker current={currentIdx + 1} total={exam.items.length} />
        </div>
        {timeLeft !== null && (
          <div
            className={`px-3 py-1.5 rounded-[8px] text-xs font-bold tabular-nums ${
              isLowTime
                ? "bg-danger text-white animate-pulse"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <SectionCard className="mb-4">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-3">
          {exam.topicName} · Câu {currentIdx + 1}
          {exam.mode === "timed_exam" && (
            <span className="ml-2 text-[10px] text-neutral-400 normal-case tracking-normal">
              Bài kiểm tra
            </span>
          )}
        </p>

        <p className="text-[22px] font-extrabold text-neutral-900 leading-snug mb-6">
          {question.questionText}
        </p>

        {isMCQ && question.choices ? (
          <AnswerOptionsMCQ
            choices={question.choices}
            onSelect={(choiceId) => updateAnswer(question.id, choiceId)}
            selectedId={answers[question.id] ?? null}
            disabled={submitted || submitting}
          />
        ) : (
          <AnswerOptionsFillin
            value={answers[question.id] ?? ""}
            onChange={(val) => updateAnswer(question.id, val)}
            disabled={submitted || submitting}
          />
        )}

        {/* Show hint for fill-in after user starts typing */}
        {!isMCQ && question.hint && answers[question.id] && (
          <div className="mt-4 p-3 bg-warning-light border border-warning/30 rounded-[8px] text-xs text-warning font-medium">
            💡 {question.hint}
          </div>
        )}
      </SectionCard>

      {submitError && (
        <p className="text-xs text-danger font-medium mb-3">{submitError}</p>
      )}

      <div className="flex justify-between items-center">
        {currentIdx > 0 ? (
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            disabled={submitted || submitting}
            className="px-4 py-2 rounded-[8px] border border-neutral-200 text-sm text-neutral-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
          >
            ← Câu trước
          </button>
        ) : (
          <span />
        )}

        {isLast ? (
          <button
            onClick={submitExam}
            disabled={submitting || submitted}
            className="px-6 py-2.5 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Đang nộp..." : "Nộp bài →"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx((i) => i + 1)}
            disabled={submitted || submitting}
            className="px-6 py-2.5 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Câu tiếp →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function PracticeSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[680px] mx-auto flex items-center justify-center h-48">
          <p className="text-sm text-neutral-400">Đang tải...</p>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}

