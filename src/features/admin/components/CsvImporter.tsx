"use client";

import { useState } from "react";
import type { CsvImportResponse } from "@/types/api";

interface CsvImporterProps {
  type: "topics" | "skills" | "questions";
  label: string;
}

export function CsvImporter({ type, label }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`/api/admin/import/${type}`, {
        method: "POST",
        body:   form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lỗi import.");
        return;
      }
      setResult(data as CsvImportResponse);
    } catch {
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-neutral-200 rounded-[10px] p-4 bg-white space-y-3">
      <p className="text-sm font-semibold text-neutral-700">{label}</p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-neutral-600 file:mr-3 file:py-1 file:px-3 file:border file:border-neutral-300 file:rounded-md file:text-xs file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100"
        />
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="text-xs bg-blue-500 text-white px-4 py-1.5 rounded-md hover:bg-blue-600 disabled:opacity-40 shrink-0"
        >
          {loading ? "Đang import…" : "Import CSV"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">✓ {result.successCount} thành công</span>
            {result.errorCount > 0 && (
              <span className="text-red-500 font-semibold">✗ {result.errorCount} lỗi</span>
            )}
          </div>
          {result.rows.filter((r) => r.status === "error").length > 0 && (
            <ul className="text-[11px] text-red-500 space-y-0.5 max-h-40 overflow-y-auto bg-red-50 rounded-md p-2">
              {result.rows
                .filter((r) => r.status === "error")
                .map((r) => (
                  <li key={r.row}>Dòng {r.row}: {r.error}</li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
