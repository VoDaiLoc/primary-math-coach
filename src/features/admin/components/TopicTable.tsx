"use client";

import { useEffect, useState } from "react";
import { CurriculumTopic } from "@/types";
import { ToggleSwitch } from "./ToggleSwitch";
import type { Grade } from "@/types/domain";
import type { PatchTopicBody } from "@/types/api";

type SaveStatus = "saving" | "saved" | "error";

interface TopicTableProps {
  topics: CurriculumTopic[];
  grades?: Grade[];
}

const STATUS_LABEL: Record<string, string> = { active: "Hoạt động", inactive: "Ẩn" };

export function TopicTable({ topics: initialTopics, grades: gradesProp }: TopicTableProps) {
  const [data, setData]   = useState(initialTopics);
  const [saves, setSaves] = useState<Record<string, SaveStatus>>({});

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [grades, setGrades]     = useState<Grade[]>(gradesProp ?? []);
  const [form, setForm]         = useState({ name: "", gradeId: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Load grades for the create form on first open (only if not passed via props)
  useEffect(() => {
    if (!showForm || grades.length > 0) return;
    fetch("/api/admin/grades")
      .then((r) => r.json())
      .then((d) => setGrades(d.grades ?? []))
      .catch(() => setGrades([]));
  }, [showForm, grades.length]);

  async function toggleActive(topic: CurriculumTopic) {
    const newStatus: "active" | "inactive" = topic.status === "active" ? "inactive" : "active";
    setData((prev) => prev.map((t) => t.id === topic.id ? { ...t, status: newStatus } : t));
    setSaves((s) => ({ ...s, [topic.id]: "saving" }));
    try {
      const body: PatchTopicBody = { status: newStatus };
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated: CurriculumTopic = await res.json();
        setData((prev) => prev.map((t) => t.id === topic.id ? updated : t));
        setSaves((s) => ({ ...s, [topic.id]: "saved" }));
      } else {
        setData((prev) => prev.map((t) => t.id === topic.id ? { ...t, status: topic.status } : t));
        setSaves((s) => ({ ...s, [topic.id]: "error" }));
      }
    } catch {
      setData((prev) => prev.map((t) => t.id === topic.id ? { ...t, status: topic.status } : t));
      setSaves((s) => ({ ...s, [topic.id]: "error" }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.gradeId) {
      setCreateErr("Vui lòng nhập tên và chọn lớp.");
      return;
    }
    setCreating(true);
    setCreateErr(null);
    try {
      const res = await fetch("/api/admin/topics", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setCreateErr(d.error ?? "Lỗi không xác định.");
        return;
      }
      const newTopic: CurriculumTopic = await res.json();
      setData((prev) => [newTopic, ...prev]);
      setForm({ name: "", gradeId: "", description: "" });
      setShowForm(false);
    } catch {
      setCreateErr("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-neutral-400">{data.length} chủ đề</span>
        <button
          onClick={() => { setShowForm((v) => !v); setCreateErr(null); }}
          className="text-xs px-3 py-1.5 rounded-[8px] font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
        >
          {showForm ? "✕ Đóng" : "+ Tạo chủ đề mới"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-primary-light border border-primary/20 rounded-[10px] p-4 flex flex-col gap-3 animate-fade-in-up"
        >
          <p className="text-sm font-semibold text-neutral-700">Tạo chủ đề mới</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Tên chủ đề *</label>
              <input
                type="text"
                placeholder="Vd: Cộng có nhớ"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Lớp *</label>
              <select
                value={form.gradeId}
                onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                <option value="">— Chọn lớp —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.displayName}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Mô tả (tuỳ chọn)</label>
              <input
                type="text"
                placeholder="Mô tả ngắn về chủ đề..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          {createErr && <p className="text-xs text-red-500">{createErr}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="text-xs px-4 py-1.5 rounded-[7px] font-semibold text-white disabled:opacity-50 transition-all duration-200 hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
            >
              {creating ? "Đang lưu…" : "Lưu chủ đề"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs px-4 py-1.5 rounded-[7px] border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Huỷ
            </button>
          </div>
        </form>
      )}

      {/* Table — scrollable */}
      <div className="overflow-x-auto rounded-[10px]">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-neutral-200">
                {["Lớp", "Tên chủ đề", "K.năng", "T.tự", "Kích hoạt", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 pr-4 text-xs font-mono text-neutral-500 whitespace-nowrap">Lớp {t.gradeLevel}</td>
                  <td className="py-2.5 pr-4 font-medium text-neutral-800">
                    <p className="truncate max-w-[180px] sm:max-w-xs">{t.name}</p>
                    {t.description && <p className="text-[11px] text-neutral-400 truncate max-w-[180px] sm:max-w-xs">{t.description}</p>}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-500 text-xs">{t.skillCount}</td>
                  <td className="py-2.5 pr-4 text-neutral-500 font-mono text-xs">{t.displayOrder}</td>
                  <td className="py-2.5 pr-4">
                    <ToggleSwitch
                      checked={t.status === "active"}
                      onChange={() => toggleActive(t)}
                      disabled={saves[t.id] === "saving"}
                    />
                  </td>
                  <td className="py-2.5 text-[10px] whitespace-nowrap">
                    {saves[t.id] === "saving" && <span className="text-neutral-400 animate-pulse">Đang lưu…</span>}
                    {saves[t.id] === "saved"  && <span className="text-green-600 font-semibold">✓ Lưu</span>}
                    {saves[t.id] === "error"  && <span className="text-red-500 font-semibold">✗ Lỗi</span>}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-sm text-neutral-400">Chưa có chủ đề nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
