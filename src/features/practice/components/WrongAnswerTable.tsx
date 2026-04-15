"use client";

import { WrongAnswer } from "@/types";

interface WrongAnswerTableProps {
  items: WrongAnswer[];
}

export function WrongAnswerTable({ items }: WrongAnswerTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-success text-center py-4 font-medium">
        Tất cả đều đúng! Xuất sắc!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div
          key={item.questionId}
          className="rounded-[12px] border border-neutral-100 bg-neutral-50 p-4"
        >
          {/* Row: index + question */}
          <div className="flex items-start gap-2 mb-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-danger/10 text-danger text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm font-semibold text-neutral-800">{item.questionText}</p>
          </div>

          {/* Answer row */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex-1 min-w-[120px] bg-danger/5 border border-danger/20 rounded-[8px] px-3 py-2">
              <p className="text-[10px] text-danger font-semibold uppercase tracking-wide mb-0.5">Con trả lời</p>
              <p className="text-sm font-bold text-danger">{item.givenAnswer}</p>
            </div>
            <div className="flex-1 min-w-[120px] bg-success/5 border border-success/20 rounded-[8px] px-3 py-2">
              <p className="text-[10px] text-success font-semibold uppercase tracking-wide mb-0.5">Đáp án đúng</p>
              <p className="text-sm font-bold text-success">{item.correctAnswer}</p>
            </div>
          </div>

          {/* AI explanation */}
          {item.aiExplanation && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-[8px] px-3 py-2 mb-2">
              <span className="flex-shrink-0 text-base mt-0.5">💡</span>
              <p className="text-xs text-neutral-700">{item.aiExplanation}</p>
            </div>
          )}

          {/* AI friendly hint or static hint */}
          {(item.aiFriendlyHint ?? item.hint) && (
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 text-base mt-0.5">🌟</span>
              <p className="text-xs text-neutral-500 italic">
                {item.aiFriendlyHint ?? item.hint}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
