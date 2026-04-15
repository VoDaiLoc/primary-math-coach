"use client";

import { useMemo, useState } from "react";
import type { QuestionCandidateRow, ReviewCandidateBody } from "@/types/api";

interface CandidateReviewTableProps {
  candidates: QuestionCandidateRow[];
  onReviewed?: (updated: QuestionCandidateRow) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-700",
  approved:       "bg-green-100 text-green-700",
  rejected:       "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  pending_review: "Chờ duyệt",
  approved:       "Đã duyệt",
  rejected:       "Từ chối",
};
const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };
const FORMAT_LABEL: Record<string, string> = { mcq: "Trắc nghiệm", fillin: "Điền vào chỗ trống" };

export function CandidateReviewTable({ candidates, onReviewed }: CandidateReviewTableProps) {
  const [acting, setActing]     = useState<string | null>(null);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [error, setError]       = useState<string | null>(null);

  // Filter state
  const [search, setSearch]         = useState("");
  const [filterStatus, setStatus]   = useState("pending_review");
  const [filterDiff, setDiff]       = useState("");
  const [filterFormat, setFormat]   = useState("");
  const [filterValid, setValid]     = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter((c) => {
      if (q && !c.questionText.toLowerCase().includes(q) && !(c.topicName ?? "").toLowerCase().includes(q)) return false;
      if (filterStatus && c.candidateStatus !== filterStatus) return false;
      if (filterDiff   && c.difficulty !== filterDiff)        return false;
      if (filterFormat && c.format !== filterFormat)          return false;
      if (filterValid === "passed"  && !c.validatorPassed)    return false;
      if (filterValid === "warning" && c.validatorPassed)     return false;
      return true;
    });
  }, [candidates, search, filterStatus, filterDiff, filterFormat, filterValid]);

  async function review(id: string, action: ReviewCandidateBody["action"], edits?: Partial<ReviewCandidateBody>) {
    setActing(id);
    setError(null);
    try {
      const body: ReviewCandidateBody = { action, ...edits };
      const res = await fetch(`/api/admin/question-candidates/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Lỗi không xác định.");
        return;
      }
      const updated: QuestionCandidateRow = await res.json();
      onReviewed?.(updated);
      setEditId(null);
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Tìm câu hỏi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select value={filterStatus} onChange={(e) => setStatus(e.target.value)}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterDiff} onChange={(e) => setDiff(e.target.value)}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả độ khó</option>
          {Object.entries(DIFF_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterFormat} onChange={(e) => setFormat(e.target.value)}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả dạng</option>
          {Object.entries(FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterValid} onChange={(e) => setValid(e.target.value)}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả validator</option>
          <option value="passed">Validator OK</option>
          <option value="warning">Có cảnh báo</option>
        </select>
        <span className="ml-auto text-xs text-neutral-400">{filtered.length} câu</span>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-400 py-4">Không có câu nào phù hợp.</p>
      ) : (
        filtered.map((c) => (

        <div key={c.id} className="border border-neutral-200 rounded-[10px] p-4 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.candidateStatus]}`}>
                  {c.candidateStatus.replace("_", " ")}
                </span>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                  {c.topicName}
                </span>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-mono uppercase">
                  {c.format}
                </span>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                  {DIFF_LABEL[c.difficulty] ?? c.difficulty}
                </span>
                {!c.validatorPassed && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    Validator cảnh báo
                  </span>
                )}
              </div>

              {editId === c.id ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    className="w-full text-sm border border-neutral-200 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-neutral-500">Đáp án:</label>
                    <input
                      className="text-sm border border-neutral-200 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1"
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-800 mt-1">{c.questionText}</p>
              )}

              <p className="text-xs text-neutral-400 mt-1">Đáp án: {c.correctAnswer}</p>

              {c.validatorErrors.length > 0 && (
                <details className="mt-1">
                  <summary className="text-[10px] text-orange-600 cursor-pointer">Xem lỗi validator</summary>
                  <ul className="text-[10px] text-orange-600 list-disc ml-4 mt-1">
                    {c.validatorErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>

            {c.candidateStatus === "pending_review" && (
              <div className="flex flex-col gap-1.5 shrink-0">
                {editId !== c.id ? (
                  <>
                    <button
                      onClick={() => review(c.id, "approve")}
                      disabled={acting === c.id}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 disabled:opacity-40"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => { setEditId(c.id); setEditText(c.questionText); setEditAnswer(c.correctAnswer); }}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                    >
                      Sửa & Duyệt
                    </button>
                    <button
                      onClick={() => review(c.id, "reject")}
                      disabled={acting === c.id}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 disabled:opacity-40"
                    >
                      Từ chối
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => review(c.id, "approve_with_edits", { questionText: editText, correctAnswer: editAnswer })}
                      disabled={acting === c.id}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 disabled:opacity-40"
                    >
                      {acting === c.id ? "Đang lưu…" : "Lưu & Duyệt"}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-xs border border-neutral-300 text-neutral-600 px-3 py-1 rounded-md hover:bg-neutral-50"
                    >
                      Huỷ
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {c.candidateStatus !== "pending_review" && (
            <p className="text-[10px] text-neutral-400 mt-2">
              {c.candidateStatus === "approved" ? "✓ Đã duyệt" : "✗ Đã từ chối"}
              {c.reviewedAt ? ` — ${new Date(c.reviewedAt).toLocaleDateString("vi-VN")}` : ""}
              {c.reviewedBy ? ` bởi ${c.reviewedBy}` : ""}
            </p>
          )}
        </div>
        ))
      )}
    </div>
  );
}
