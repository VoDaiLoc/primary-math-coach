"use client";

import Link from "next/link";
import { ExamResult } from "@/types";
import { cn } from "@/lib/utils";

interface ScoreHeroProps {
  result: ExamResult;
}

function cheerText(score: number, total: number) {
  const pct = score / total;
  if (pct === 1) return "Hoàn hảo! Tuyệt vời! 🏆";
  if (pct >= 0.8) return "Xuất sắc! Tiếp tục phát huy! 🌟";
  if (pct >= 0.6) return "Khá tốt! Cần ôn luyện thêm.";
  return "Cố gắng hơn nhé! Luyện tập thêm.";
}

export function ScoreHero({ result }: ScoreHeroProps) {
  const pct = Math.round((result.score / result.totalQuestions) * 100);
  const isGood = pct >= 80;

  return (
    <div
      className={cn(
        "rounded-[16px] px-8 py-10 flex flex-col items-center text-center text-white",
        isGood
          ? "bg-gradient-to-br from-success to-emerald-700"
          : "bg-gradient-to-br from-primary to-indigo-700"
      )}
    >
      <p className="text-sm font-semibold opacity-80 mb-2">{result.topicName}</p>
      <p className="text-[64px] font-extrabold leading-none">
        {result.score}<span className="text-3xl font-bold opacity-70">/{result.totalQuestions}</span>
      </p>
      <p className="text-[18px] font-semibold mt-3 opacity-90">
        {cheerText(result.score, result.totalQuestions)}
      </p>
      <p className="text-xs opacity-70 mt-1">{result.durationSeconds}s · {pct}% chính xác</p>

      <div className="flex gap-3 mt-6">
        <Link
          href="/practice/new"
          className="inline-flex items-center px-5 py-2.5 rounded-[10px] bg-white/20 backdrop-blur text-white text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          Luyện tiếp
        </Link>
        <Link
          href="/home"
          className="inline-flex items-center px-5 py-2.5 rounded-[10px] bg-white text-primary text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
