"use client";

import Link from "next/link";
import { Student } from "@/types";

interface StudentQuickViewProps {
  student: Student;
  weeklyCount: number;
  weeklyAccuracy: number;
}

export function StudentQuickView({ student, weeklyCount, weeklyAccuracy }: StudentQuickViewProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-[14px] p-5 flex items-center justify-between gap-4 flex-wrap">
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-light border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
          {student.name.split(" ").pop()?.charAt(0)}
        </div>
        <div>
          <p className="text-[16px] font-bold text-neutral-900">{student.name}</p>
          <p className="text-xs text-neutral-500">
            {student.gradeName} · Năm học {student.schoolYear}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-[22px] font-extrabold text-primary">{weeklyCount}</p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide">bài tuần này</p>
        </div>
        <div className="text-center">
          <p className="text-[22px] font-extrabold text-success">{weeklyAccuracy}%</p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide">độ chính xác</p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}
