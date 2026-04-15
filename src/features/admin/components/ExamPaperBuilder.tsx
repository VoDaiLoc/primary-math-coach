"use client";

import { useState } from "react";
import type { ExamPaperRow, ExamPaperDetail, ExamPaperDetailItem, QuestionBankItemRow } from "@/types/api";

interface ExamPaperBuilderProps {
  paper: ExamPaperDetail;
  bankItems: QuestionBankItemRow[];
  onItemAdded?: (item: ExamPaperDetailItem) => void;
  onItemRemoved?: (itemId: string) => void;
}

const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };

export function ExamPaperBuilder({ paper, bankItems, onItemAdded, onItemRemoved }: ExamPaperBuilderProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addedIds = new Set(paper.items.map((i) => i.questionBankItemId));
  const available = bankItems.filter((b) => !addedIds.has(b.id) && b.reviewStatus === "approved" && b.isActive);

  async function addItem(bankItemId: string) {
    setAddingId(bankItemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/exam-papers/${paper.id}/items`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ questionBankItemId: bankItemId }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Lỗi."); return; }
      const item: ExamPaperDetailItem = await res.json();
      onItemAdded?.(item);
    } finally {
      setAddingId(null);
    }
  }

  async function removeItem(itemId: string) {
    setRemovingId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/exam-papers/${paper.id}/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Lỗi."); return; }
      onItemRemoved?.(itemId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Current items */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Câu trong đề ({paper.items.length})
        </p>
        {paper.items.length === 0 ? (
          <p className="text-sm text-neutral-400">Chưa có câu nào. Chọn từ danh sách bên phải.</p>
        ) : (
          <ol className="space-y-2">
            {paper.items.map((item, idx) => (
              <li key={item.id} className="flex gap-3 items-start border border-neutral-100 rounded-md p-3 bg-white">
                <span className="text-xs text-neutral-400 font-mono mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 truncate">{item.questionText}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {DIFF_LABEL[item.difficulty]} · {item.format.toUpperCase()} · Đáp án: {item.correctAnswer}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={removingId === item.id}
                  className="text-[11px] text-red-500 hover:text-red-700 disabled:opacity-40 shrink-0"
                >
                  {removingId === item.id ? "…" : "Xoá"}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Available bank items */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Câu hỏi đã duyệt ({available.length})
        </p>
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {available.map((b) => (
            <div key={b.id} className="flex gap-3 items-start border border-neutral-100 rounded-md p-3 bg-white hover:bg-neutral-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-800 truncate">{b.questionText}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {b.topicName} · {DIFF_LABEL[b.difficulty]} · {b.format.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => addItem(b.id)}
                disabled={addingId === b.id}
                className="text-[11px] bg-blue-500 text-white px-2.5 py-1 rounded-md hover:bg-blue-600 disabled:opacity-40 shrink-0"
              >
                {addingId === b.id ? "…" : "+ Thêm"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
