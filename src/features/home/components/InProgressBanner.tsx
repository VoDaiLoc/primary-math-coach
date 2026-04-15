"use client";

import Link from "next/link";
import { InProgressSession } from "@/types";

interface InProgressBannerProps {
  readonly exam: InProgressSession;
}

export function InProgressBanner({ exam }: InProgressBannerProps) {
  const percent = Math.round((exam.answeredCount / exam.totalCount) * 100);

  return (
    <div className="bg-primary-light border border-primary/30 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">
          Bài đang làm dở
        </p>
        <p className="text-[15px] font-bold text-neutral-900 truncate">{exam.topicName}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          Câu {exam.answeredCount}/{exam.totalCount} · {exam.gradeName}
        </p>
        <div className="mt-2.5 h-2 rounded-full bg-primary/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <Link
        href={exam.examId ? `/practice/session?examId=${exam.examId}` : "/practice/new"}
        className={
          "flex-shrink-0 inline-flex items-center justify-center px-5 py-2"
          + " rounded-[8px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        }
      >
        Tiếp tục làm bài →
      </Link>
    </div>
  );
}
