"use client";

import { HistoryEntry } from "@/types";
import { cn } from "@/lib/utils";

interface HistoryRowProps {
  entry: HistoryEntry;
}

export function HistoryRow({ entry }: HistoryRowProps) {
  const pct = Math.round((entry.score / entry.questionCount) * 100);
  const badge = pct >= 80
    ? "bg-success-light text-success"
    : pct >= 60
    ? "bg-warning-light text-warning"
    : "bg-danger-light text-danger";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
        {entry.topicName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 truncate">{entry.topicName}</p>
        <p className="text-[11px] text-neutral-400">{entry.date} · {entry.questionCount} câu</p>
      </div>
      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0", badge)}>
        {entry.score}/{entry.questionCount}
      </span>
    </div>
  );
}
