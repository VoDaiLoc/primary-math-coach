"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ScoreHero } from "@/features/practice/components/ScoreHero";
import { WrongAnswerTable } from "@/features/practice/components/WrongAnswerTable";
import { SectionCard } from "@/components/shared/SectionCard";
import type { GetExamResultResponse } from "@/types/api";
import type { ExamResult } from "@/types";

// Adapts GetExamResultResponse to ExamResult (same shape, explicit cast).
function toExamResult(r: GetExamResultResponse): ExamResult {
  return r as ExamResult;
}

// ── Inner component (reads search params) ─────────────────────────────────────

function ResultContent() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const submissionId   = searchParams.get("submissionId");

  const [result, setResult]     = useState<GetExamResultResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError("Thiếu submissionId. Vui lòng làm bài trước.");
      setLoading(false);
      return;
    }

    fetch(`/api/submissions/${submissionId}/result`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải kết quả.");
        return res.json() as Promise<GetExamResultResponse>;
      })
      .then(setResult)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto space-y-5">
        {/* Score hero skeleton */}
        <div className="bg-white border border-neutral-200 rounded-[14px] p-6 animate-pulse">
          <div className="h-16 w-16 rounded-full bg-neutral-100 mx-auto mb-4" />
          <div className="h-5 w-32 bg-neutral-100 rounded mx-auto mb-2" />
          <div className="h-3 w-48 bg-neutral-100 rounded mx-auto" />
        </div>
        {/* AI encouragement skeleton */}
        <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 animate-pulse">
          <div className="h-3 w-64 bg-amber-100 rounded mx-auto" />
        </div>
        <p className="text-center text-xs text-neutral-400">Đang tạo nhận xét cho bài làm…</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-[680px] mx-auto">
        <SectionCard>
          <p className="text-sm text-danger font-medium">{error ?? "Đã xảy ra lỗi."}</p>
          <button
            onClick={() => router.push("/practice/new")}
            className="mt-4 px-4 py-2 rounded-[8px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
          >
            Luyện tập lại
          </button>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto space-y-5">
      <ScoreHero result={toExamResult(result)} />

      {/* AI encouragement banner */}
      {result.encouragementMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-[14px] px-5 py-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🌈</span>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            {result.encouragementMessage}
          </p>
        </div>
      )}

      {result.wrongAnswers.length > 0 && (
        <SectionCard title="Các câu chưa đúng">
          <WrongAnswerTable items={result.wrongAnswers} />
        </SectionCard>
      )}

      {/* Summary stats */}
      <div className="bg-white border border-neutral-200 rounded-[14px] p-5 flex flex-wrap gap-4">
        {[
          { label: "Thời gian", value: `${result.durationSeconds}s` },
          { label: "Đúng",      value: `${result.score}/${result.totalQuestions}` },
          { label: "Sai",       value: result.wrongAnswers.length },
          { label: "Chủ đề",   value: result.topicName },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 min-w-[80px] text-center border border-neutral-100 rounded-[10px] p-3">
            <p className="text-[18px] font-extrabold text-neutral-900">{value}</p>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push("/practice/new")}
          className="px-5 py-2.5 rounded-[10px] border border-primary text-primary text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          Luyện tập tiếp
        </button>
        <button
          onClick={() => router.push("/home")}
          className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Về trang chủ
        </button>
      </div>

      {/* Next recommendations */}
      {result.nextRecommendations.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-[14px] p-5 space-y-3">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
            Gợi ý bài tiếp theo
          </p>
          <div className="flex flex-col gap-2">
            {result.nextRecommendations.map((rec) => (
              <button
                key={rec.id}
                onClick={() => router.push(`/practice/new?topicId=${rec.topicId}`)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-[10px] border border-neutral-100 hover:border-primary/40 hover:bg-primary-light transition-colors"
              >
                <span className="mt-0.5 w-6 h-6 flex-shrink-0 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold">→</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{rec.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{rec.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function PracticeResultPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[680px] mx-auto flex items-center justify-center h-48">
          <p className="text-sm text-neutral-400">Đang tải...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

