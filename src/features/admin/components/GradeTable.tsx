"use client";

import { useState } from "react";
import { Grade } from "@/types";
import { ToggleSwitch } from "./ToggleSwitch";

type SaveStatus = "saving" | "saved" | "error";

interface GradeTableProps {
  grades: Grade[];
}

export function GradeTable({ grades }: GradeTableProps) {
  const [data, setData]   = useState<Grade[]>(grades);
  const [saves, setSaves] = useState<Record<string, SaveStatus>>({});

  async function togglePublic(grade: Grade) {
    const newVal = !grade.isPublic;
    setData((prev) => prev.map((g) => g.id === grade.id ? { ...g, isPublic: newVal } : g));
    setSaves((s) => ({ ...s, [grade.id]: "saving" }));
    try {
      const res = await fetch(`/api/admin/grades/${grade.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isPublic: newVal }),
      });
      if (res.ok) {
        const updated: Grade = await res.json();
        setData((prev) => prev.map((g) => g.id === grade.id ? updated : g));
        setSaves((s) => ({ ...s, [grade.id]: "saved" }));
      } else {
        setData((prev) => prev.map((g) => g.id === grade.id ? { ...g, isPublic: grade.isPublic } : g));
        setSaves((s) => ({ ...s, [grade.id]: "error" }));
      }
    } catch {
      setData((prev) => prev.map((g) => g.id === grade.id ? { ...g, isPublic: grade.isPublic } : g));
      setSaves((s) => ({ ...s, [grade.id]: "error" }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-[10px]">
      <table className="w-full text-sm min-w-[340px]">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-neutral-200">
            <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4">Lớp</th>
            <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4">Tên</th>
            <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4 hidden sm:table-cell">Chủ đề</th>
            <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4">Công khai</th>
            <th className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((g) => (
            <tr key={g.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
              <td className="py-3 pr-4 font-mono font-bold text-neutral-700">{g.level}</td>
              <td className="py-3 pr-4 font-medium text-neutral-800">{g.displayName}</td>
              <td className="py-3 pr-4 text-neutral-500 hidden sm:table-cell">{g.topicCount} chủ đề</td>
              <td className="py-3 pr-4">
                <ToggleSwitch
                  checked={g.isPublic}
                  onChange={() => togglePublic(g)}
                  disabled={saves[g.id] === "saving"}
                />
              </td>
              <td className="py-3 text-[10px]">
                {saves[g.id] === "saving" && <span className="text-neutral-400 animate-pulse">Đang lưu…</span>}
                {saves[g.id] === "saved"  && <span className="text-green-600 font-semibold">✓ Lưu</span>}
                {saves[g.id] === "error"  && <span className="text-red-500 font-semibold">✗ Lỗi</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
