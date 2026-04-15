"use client";

import { SkillProgress } from "@/types";
import { cn } from "@/lib/utils";

interface SkillProgressListProps {
  skills: SkillProgress[];
}

function getBarColor(accuracy: number) {
  if (accuracy >= 80) return "bg-success";
  if (accuracy >= 60) return "bg-warning";
  return "bg-danger";
}

function getStatusLabel(accuracy: number) {
  if (accuracy >= 80) return { text: "Tốt", class: "text-success bg-success-light" };
  if (accuracy >= 60) return { text: "Cần ôn", class: "text-warning bg-warning-light" };
  return { text: "Yếu", class: "text-danger bg-danger-light" };
}

export function SkillProgressList({ skills }: SkillProgressListProps) {
  return (
    <div className="flex flex-col gap-4">
      {skills.map((s) => {
        const status = getStatusLabel(s.accuracy);
        return (
          <div key={s.topicId} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-800 truncate max-w-[60%]">{s.topicName}</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", status.class)}>
                  {status.text}
                </span>
                <span className="text-xs font-semibold text-neutral-500">{s.accuracy}%</span>
              </div>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getBarColor(s.accuracy))}
                style={{ width: `${s.accuracy}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400">{s.sessionCount} bài · {s.totalQuestions} câu</p>
          </div>
        );
      })}
    </div>
  );
}
