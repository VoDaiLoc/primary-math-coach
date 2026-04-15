"use client";

import { useMemo, useState } from "react";
import type { QuestionBankItemRow } from "@/types/api";

interface QuestionBankTableProps {
  items: QuestionBankItemRow[];
  onArchive?: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  approved:       "bg-green-100 text-green-700",
  draft:          "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-700",
  rejected:       "bg-red-100 text-red-600",
  archived:       "bg-neutral-100 text-neutral-500",
};
const STATUS_LABEL: Record<string, string> = {
  approved:       "Đã duyệt",
  draft:          "Nháp",
  pending_review: "Chờ duyệt",
  rejected:       "Từ chối",
  archived:       "Lưu trữ",
};
const SOURCE_LABEL: Record<string, string> = {
  manual:       "Thủ công",
  imported:     "Import",
  ai_generated: "AI",
};
const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Vừa", hard: "Khó" };
const FORMAT_LABEL: Record<string, string> = { mcq: "Trắc nghiệm", fillin: "Điền vào chỗ trống" };

const PAGE_SIZE = 20;

export function QuestionBankTable({ items, onArchive }: QuestionBankTableProps) {
  const [archiving, setArchiving] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [filterStatus, setStatus] = useState("");
  const [filterSource, setSource] = useState("");
  const [filterDiff, setDiff]     = useState("");
  const [filterFormat, setFormat] = useState("");
  const [page, setPage]           = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (q && !item.questionText.toLowerCase().includes(q) && !(item.topicName ?? "").toLowerCase().includes(q)) return false;
      if (filterStatus && item.reviewStatus !== filterStatus) return false;
      if (filterSource && item.source       !== filterSource) return false;
      if (filterDiff   && item.difficulty   !== filterDiff)   return false;
      if (filterFormat && item.format       !== filterFormat) return false;
      return true;
    });
  }, [items, search, filterStatus, filterSource, filterDiff, filterFormat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function reset() {
    setSearch(""); setStatus(""); setSource(""); setDiff(""); setFormat(""); setPage(1);
  }

  async function handleArchive(id: string) {
    setArchiving(id);
    try {
      const res = await fetch(`/api/admin/question-bank/${id}`, { method: "DELETE" });
      if (res.ok) onArchive?.(id);
    } finally {
      setArchiving(null);
    }
  }

  const hasFilter = search || filterStatus || filterSource || filterDiff || filterFormat;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Tìm câu hỏi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select value={filterStatus} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả nguồn</option>
          {Object.entries(SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterDiff} onChange={(e) => { setDiff(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả độ khó</option>
          {Object.entries(DIFF_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterFormat} onChange={(e) => { setFormat(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-600">
          <option value="">Tất cả dạng</option>
          {Object.entries(FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {hasFilter && (
          <button onClick={reset} className="text-xs text-neutral-400 hover:text-neutral-700 underline">
            Xoá lọc
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{filtered.length} câu</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-400 py-4">Không tìm thấy câu hỏi nào.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  {["Câu hỏi", "Chủ đề", "Dạng", "Độ khó", "Nguồn", "Trạng thái", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide pb-3 pr-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 pr-4 max-w-[280px]">
                      <p className="truncate text-neutral-800 font-medium">{item.questionText}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Đáp án: {item.correctAnswer}</p>
                    </td>
                    <td className="py-3 pr-4 text-neutral-500 whitespace-nowrap">{item.topicName}</td>
                    <td className="py-3 pr-4 text-xs text-neutral-500">{FORMAT_LABEL[item.format] ?? item.format}</td>
                    <td className="py-3 pr-4 text-neutral-500">{DIFF_LABEL[item.difficulty] ?? item.difficulty}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {SOURCE_LABEL[item.source] ?? item.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.reviewStatus] ?? ""}`}>
                        {STATUS_LABEL[item.reviewStatus] ?? item.reviewStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      {item.reviewStatus !== "archived" && (
                        <button
                          onClick={() => handleArchive(item.id)}
                          disabled={archiving === item.id}
                          className="text-[11px] text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          {archiving === item.id ? "…" : "Ẩn"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex gap-1 items-center justify-end pt-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-2 py-1 rounded border border-neutral-200 disabled:opacity-40">←</button>
              <span className="text-xs text-neutral-500">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-xs px-2 py-1 rounded border border-neutral-200 disabled:opacity-40">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
