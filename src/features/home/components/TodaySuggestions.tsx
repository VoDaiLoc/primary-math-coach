"use client";

import Link from "next/link";
import { Recommendation } from "@/types";
import { cn } from "@/lib/utils";

interface TodaySuggestionsProps {
  suggestions: Recommendation[];
}

const difficultyLabel: Record<string, string> = {
  easy:   "Dễ",
  medium: "Vừa",
  hard:   "Khó",
};

const formatLabel: Record<string, string> = {
  mcq:     "Trắc nghiệm",
  fillin:  "Điền vào",
};

const tagClass = "text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium";

export function TodaySuggestions({ suggestions }: TodaySuggestionsProps) {
  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((s) => (
        <div
          key={s.id}
          className="bg-white border border-neutral-200 rounded-[12px] p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-neutral-800 truncate">{s.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{s.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className={tagClass}>{difficultyLabel[s.difficulty] ?? s.difficulty}</span>
              <span className={tagClass}>{formatLabel[s.format] ?? s.format}</span>
              <span className={tagClass}>{s.questionCount} câu</span>
            </div>
          </div>
          <Link
            href={`/practice/new?topic=${encodeURIComponent(s.title)}`}
            className="flex-shrink-0 inline-flex items-center px-4 py-1.5 rounded-[7px] bg-primary-light text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Bắt đầu
          </Link>
        </div>
      ))}
    </div>
  );
}
