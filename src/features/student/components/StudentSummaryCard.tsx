"use client";

import { Student, SkillProgress } from "@/types";
import { cn } from "@/lib/utils";

interface StudentSummaryCardProps {
  student: Student;
  skills: SkillProgress[];
  weeklyCount: number;
  weeklyAccuracy: number;
}

function MasteryBadge({ accuracy }: { accuracy: number }) {
  if (accuracy >= 80) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-light text-success">Thành thạo</span>;
  if (accuracy >= 60) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-light text-warning">Đang học</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-light text-danger">Cần ôn</span>;
}

export function StudentSummaryCard({ student, skills, weeklyCount, weeklyAccuracy }: StudentSummaryCardProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-[16px] p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-[60px] h-[60px] rounded-full bg-primary-light border-2 border-primary flex items-center justify-center text-[20px] font-extrabold text-primary">
          {student.name.split(" ").pop()?.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-bold text-neutral-900">{student.name}</p>
          <p className="text-sm text-neutral-500">{student.gradeName} · {student.schoolYear}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Trường: {student.schoolName}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 bg-neutral-50 rounded-[12px] p-4">
        {[
          { label: "Bài / tuần", value: weeklyCount, color: "text-primary" },
          { label: "Chính xác", value: `${weeklyAccuracy}%`, color: "text-success" },
          { label: "Chủ đề học", value: skills.length, color: "text-neutral-800" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={cn("text-[22px] font-extrabold leading-none", color)}>{value}</p>
            <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Kỹ năng</p>
        <div className="flex flex-col gap-3">
          {skills.map((s) => (
            <div key={s.topicId} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700 truncate max-w-[60%]">{s.topicName}</span>
                  <MasteryBadge accuracy={s.accuracy} />
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.accuracy >= 80 ? "bg-success" : s.accuracy >= 60 ? "bg-warning" : "bg-danger"
                    )}
                    style={{ width: `${s.accuracy}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-500 w-8 text-right">{s.accuracy}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
