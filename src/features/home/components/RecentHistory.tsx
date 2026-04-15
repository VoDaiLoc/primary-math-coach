"use client";

import Link from "next/link";
import { HistoryEntry } from "@/types";
import { cn } from "@/lib/utils";

interface RecentHistoryProps {
  entries: HistoryEntry[];
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  return (
    <span
      className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-full",
        pct >= 80 ? "bg-success-light text-success" : pct >= 60 ? "bg-warning-light text-warning" : "bg-danger-light text-danger"
      )}
    >
      {score}/{total}
    </span>
  );
}

export function RecentHistory({ entries }: RecentHistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-400 text-center py-4">
        Chưa có lịch sử làm bài.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100">
      {entries.map((e) => (
        <div key={e.id} className="flex items-center justify-between py-3 gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            {e.topicName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-neutral-800 truncate">{e.topicName}</p>
            <p className="text-[11px] text-neutral-400">
              {e.date} · {e.questionCount} câu
            </p>
          </div>
          <ScoreBadge score={e.score} total={e.questionCount} />
        </div>
      ))}
    </div>
  );
}
