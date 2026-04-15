"use client";

import { WeeklyStats } from "@/types";

interface ChartPlaceholderProps {
  data: WeeklyStats[];
}

export function ChartPlaceholder({ data }: ChartPlaceholderProps) {
  const maxCount = Math.max(...data.map((d) => d.sessionCount), 1);

  return (
    <div className="flex items-end gap-2 h-[100px]">
      {data.map((d, i) => {
        const heightPct = Math.round((d.sessionCount / maxCount) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-neutral-400">{d.sessionCount}</span>
            <div className="w-full rounded-t-[4px] bg-primary-light relative overflow-hidden"
              style={{ height: `${Math.max(heightPct * 0.7, 6)}px` }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-[4px] transition-all"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
