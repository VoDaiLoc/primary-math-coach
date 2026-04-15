"use client";

interface ProgressTrackerProps {
  current: number;  // 1-based
  total: number;
}

export function ProgressTracker({ current, total }: ProgressTrackerProps) {
  const percent = Math.round(((current - 1) / total) * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Dot trail */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current - 1
                ? "bg-success"
                : i === current - 1
                ? "bg-primary"
                : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden hidden sm:block">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Counter */}
      <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  );
}
