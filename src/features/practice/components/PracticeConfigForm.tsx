"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Grade, CurriculumTopic, DifficultyLevel, QuestionFormat } from "@/types";
import type { ExamMode } from "@/types/enums";
import type { CreateExamRequest, CreateExamResponse } from "@/types/api";

interface PracticeConfigFormProps {
  grades: Grade[];
  topics: CurriculumTopic[];
}

const DIFFICULTIES: { value: DifficultyLevel; label: string }[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Vừa" },
  { value: "hard", label: "Khó" },
];

const FORMATS: { value: QuestionFormat; label: string }[] = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "fillin", label: "Điền vào chỗ trống" },
];

const COUNTS = [5, 10, 15, 20];

const MODES: { value: ExamMode; label: string; description: string }[] = [
  { value: "practice",   label: "Luyện tập",                description: "Không giới hạn thời gian" },
  { value: "timed_exam", label: "Bài kiểm tra có thời gian", description: "Đếm ngược, tự nộp khi hết giờ" },
];

const TIME_LIMITS = [5, 10, 15] as const; // minutes

export function PracticeConfigForm({ grades, topics }: PracticeConfigFormProps) {
  const router = useRouter();

  const firstGradeId = grades[0]?.id ?? "";
  const [selectedGrade, setSelectedGrade]       = useState(firstGradeId);
  const [difficulty, setDifficulty]             = useState<DifficultyLevel>("medium");
  const [format, setFormat]                     = useState<QuestionFormat>("mcq");
  const [count, setCount]                       = useState(10);
  const [mode, setMode]                         = useState<ExamMode>("practice");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [studentId, setStudentId]               = useState<string | null>(null);
  const [studentError, setStudentError]         = useState<string | null>(null);

  // Load student ID from session on mount
  useEffect(() => {
    fetch("/api/me/student")
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json();
          setStudentError(d.error ?? "Không tải được thông tin học sinh.");
        } else {
          const d = await res.json();
          setStudentId(d.studentId);
        }
      })
      .catch(() => setStudentError("Lỗi kết nối. Vui lòng tải lại trang."));
  }, []);

  // Filter topics by selected grade (matched via grade.level === topic.gradeLevel)
  const selectedLevel = grades.find((g) => g.id === selectedGrade)?.level ?? 0;
  const filteredTopics = topics.filter((t) => t.gradeLevel === selectedLevel);
  const [selectedTopic, setSelectedTopic] = useState(filteredTopics[0]?.id ?? "");

  // When grade changes, reset topic to first of new grade
  function handleGradeChange(gradeId: string) {
    setSelectedGrade(gradeId);
    const level = grades.find((g) => g.id === gradeId)?.level ?? 0;
    const newTopics = topics.filter((t) => t.gradeLevel === level);
    setSelectedTopic(newTopics[0]?.id ?? "");
  }

  const preview = filteredTopics.find((t) => t.id === selectedTopic);

  async function handleStart() {
    if (!selectedTopic) return;
    if (!studentId) {
      setError(studentError ?? "Không tìm thấy học sinh. Vui lòng thêm học sinh vào tài khoản.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: CreateExamRequest = {
        studentId,
        topicId:       selectedTopic,
        questionCount: count,
        difficulty,
        format,
        mode,
        ...(mode === "timed_exam" ? { timeLimitMinutes } : {}),
      };
      const res = await fetch("/api/exams", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 422) {
          setError(`Ngân hàng câu hỏi chưa đủ câu cho lựa chọn này (có ${data.available ?? 0} câu, cần ${data.required ?? count} câu). Admin cần bổ sung nội dung.`);
        } else {
          setError(data.error ?? "Không thể tạo bài luyện tập.");
        }
        return;
      }
      const { examId }: CreateExamResponse = await res.json();
      router.push(`/practice/session?examId=${examId}`);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {studentError && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ {studentError}
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-5">
      {/* Config panel */}
      <div className="flex-1 bg-white border border-neutral-200 rounded-[14px] p-5 flex flex-col gap-5">
        {/* Grade */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Lớp</p>
          <div className="flex flex-wrap gap-2">
            {grades.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGradeChange(g.id)}
                className="px-3 py-1.5 rounded-[8px] border text-xs font-medium transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={selectedGrade === g.id ? {
                  background: "linear-gradient(135deg, #0F52BA, #002B8C)",
                  color: "#fff",
                  borderColor: "transparent",
                  boxShadow: "0 2px 8px rgba(15,82,186,0.40)",
                } : {
                  background: "#fff",
                  borderColor: "#d5ddf0",
                  color: "#44527a",
                }}
              >
                {g.displayName}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Chủ đề</p>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full border border-neutral-200 rounded-[8px] px-3 py-2 text-sm text-neutral-800 outline-none focus:border-primary transition-colors"
            style={{ background: "#f8faff" }}
          >
            {filteredTopics.length === 0 ? (
              <option value="">— Không có chủ đề —</option>
            ) : (
              filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Quick presets row */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Bộ nhanh</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "5 câu · Dễ", difficulty: "easy" as DifficultyLevel, count: 5 },
              { label: "10 câu · Vừa", difficulty: "medium" as DifficultyLevel, count: 10 },
              { label: "15 câu · Khó", difficulty: "hard" as DifficultyLevel, count: 15 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setDifficulty(preset.difficulty); setCount(preset.count); }}
                className="px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #e8effe 0%, #F0FFFF 100%)",
                  color: "#0F52BA",
                  border: "1px solid rgba(15,82,186,0.25)",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Độ khó</p>
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="px-3 py-1.5 rounded-[8px] border text-xs font-medium transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={difficulty === d.value ? {
                  background: "linear-gradient(135deg, #0F52BA, #002B8C)",
                  color: "#fff",
                  borderColor: "transparent",
                  boxShadow: "0 2px 8px rgba(15,82,186,0.38)",
                } : {
                  background: "#fff",
                  borderColor: "#d5ddf0",
                  color: "#44527a",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Loại câu hỏi</p>
          <div className="flex gap-2 flex-wrap">
            {FORMATS.map((t) => (
              <button
                key={t.value}
                onClick={() => setFormat(t.value)}
                className="px-3 py-1.5 rounded-[8px] border text-xs font-medium transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={format === t.value ? {
                  background: "linear-gradient(135deg, #0F52BA, #002B8C)",
                  color: "#fff",
                  borderColor: "transparent",
                  boxShadow: "0 2px 8px rgba(15,82,186,0.38)",
                } : {
                  background: "#fff",
                  borderColor: "#d5ddf0",
                  color: "#44527a",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Số câu</p>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className="w-12 py-1.5 rounded-[8px] border text-xs font-bold transition-all duration-200 hover:scale-[1.06] active:scale-[0.97]"
                style={count === c ? {
                  background: "linear-gradient(135deg, #0F52BA, #002B8C)",
                  color: "#fff",
                  borderColor: "transparent",
                  boxShadow: "0 2px 8px rgba(15,82,186,0.38)",
                } : {
                  background: "#fff",
                  borderColor: "#d5ddf0",
                  color: "#44527a",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Chế độ làm bài</p>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-[8px] border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={mode === m.value ? {
                  background: "linear-gradient(135deg, #0F52BA 0%, #002B8C 100%)",
                  color: "#fff",
                  borderColor: "transparent",
                  boxShadow: "0 2px 10px rgba(15,82,186,0.35)",
                } : {
                  background: "#fff",
                  borderColor: "#d5ddf0",
                  color: "#44527a",
                }}
              >
                <span className="text-xs font-semibold leading-tight mt-0.5">{m.label}</span>
                <span
                  className="text-[10px] leading-tight ml-auto"
                  style={{ color: mode === m.value ? "rgba(240,255,255,0.75)" : "#8a9abf" }}
                >
                  {m.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Time limit — only when timed_exam */}
        {mode === "timed_exam" && (
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Thời gian</p>
            <div className="flex gap-2">
              {TIME_LIMITS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeLimitMinutes(t)}
                  className={`px-3 py-1.5 rounded-[8px] border text-xs font-bold transition-colors ${
                    timeLimitMinutes === t
                      ? "border-primary bg-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {t} phút
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-danger font-medium">{error}</p>
        )}
        <button
          onClick={handleStart}
          disabled={loading || !selectedTopic || !studentId}
          className="mt-2 inline-flex justify-center items-center gap-2 px-6 py-3 rounded-[10px] text-white font-semibold text-sm
                     transition-all duration-200 hover:scale-[1.02] hover:shadow-primary-lg active:scale-[0.98]
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ background: "linear-gradient(135deg, #0F52BA 0%, #002B8C 100%)", boxShadow: "0 4px 14px rgba(15,82,186,0.40)" }}
        >
          {loading ? "Đang tạo bài..." : "Bắt đầu luyện tập →"}
        </button>
      </div>

      {/* Preview card */}
      <div
        className="w-full lg:w-[280px] rounded-[14px] p-5 flex flex-col gap-3"
        style={{
          background: "linear-gradient(160deg, #002B8C 0%, #0F52BA 60%, #282888 100%)",
          boxShadow: "0 8px 32px rgba(0,43,140,0.28)",
        }}
      >
        <p className="text-[11px] font-bold text-[#F0FFFF]/60 uppercase tracking-widest">Xem trước</p>
        <p className="text-[15px] font-bold text-white">{preview?.name ?? "—"}</p>
        <p className="text-xs text-white/60">{preview?.description ?? ""}</p>
        <div className="flex flex-col gap-2 mt-2">
          {[
            { label: "Độ khó",   value: DIFFICULTIES.find(d => d.value === difficulty)?.label ?? "" },
            { label: "Loại câu", value: FORMATS.find(t => t.value === format)?.label ?? "" },
            { label: "Số câu",   value: `${count} câu` },
            { label: "Chế độ",   value: MODES.find(m => m.value === mode)?.label ?? "" },
            ...(mode === "timed_exam" ? [{ label: "Thời gian", value: `${timeLimitMinutes} phút` }] : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-xs border-b border-white/10 pb-1.5 last:border-0">
              <span className="text-white/50">{row.label}</span>
              <span className="font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
