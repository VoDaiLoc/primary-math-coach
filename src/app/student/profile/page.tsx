"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StudentSummaryCard } from "@/features/student/components/StudentSummaryCard";
import { RecentHistory } from "@/features/home/components/RecentHistory";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import type { StudentProfileResponse, UpdateStudentProfileRequest } from "@/types/api";

const LEVEL_LABELS: Record<string, string> = {
  beginner:     "Mới bắt đầu",
  intermediate: "Đang tiến bộ",
  advanced:     "Nâng cao",
};

export default function StudentProfilePage() {
  const [data, setData]       = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk]   = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state (initialised from data on load)
  const [form, setForm] = useState<UpdateStudentProfileRequest>({});

  // ── Load ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/students/${DEMO_STUDENT_ID}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải hồ sơ.");
        return res.json() as Promise<StudentProfileResponse>;
      })
      .then((d) => {
        setData(d);
        setForm({
          name:                d.name,
          schoolName:          d.schoolName,
          schoolYear:          d.schoolYear,
          weeklyGoalSessions:  d.weeklyGoalSessions ?? undefined,
          currentFocusTopicId: d.currentFocusTopicId ?? undefined,
          currentLevel:        d.currentLevel ?? undefined,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  function handleSave() {
    setSaveError(null);
    setSaveOk(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/students/${DEMO_STUDENT_ID}/profile`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(err.message ?? "Lưu thất bại.");
        }
        // Re-fetch to get fresh data
        const updated = await fetch(`/api/students/${DEMO_STUDENT_ID}/profile`)
          .then((r) => r.json() as Promise<StudentProfileResponse>);
        setData(updated);
        setEditing(false);
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
      } catch (err) {
        setSaveError((err as Error).message);
      }
    });
  }

  // ── Shared student shape for StudentSummaryCard ───────────────────────────────
  const studentForCard = data
    ? {
        id:         data.studentId,
        name:       data.name,
        gradeLevel: 0, // not shown in card
        gradeName:  data.gradeName,
        email:      "",
        schoolName: data.schoolName,
        schoolYear: data.schoolYear,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-neutral-400">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !data || !studentForCard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-danger">{error ?? "Đã xảy ra lỗi."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hồ sơ học sinh"
        subtitle="Thông tin và tiến độ học tập"
        action={
          <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            ← Dashboard
          </Link>
        }
      />

      {saveOk && (
        <div className="bg-success-light border border-success/30 rounded-[10px] px-4 py-2 text-sm text-success font-medium">
          Đã lưu thành công!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: summary card */}
        <div className="lg:col-span-2">
          <StudentSummaryCard
            student={studentForCard}
            skills={data.skillProgress}
            weeklyCount={0}
            weeklyAccuracy={data.averageAccuracy}
          />
        </div>

        {/* Right: account info + edit + history */}
        <div className="flex flex-col gap-5">
          {/* Account info / edit form */}
          <SectionCard
            title="Thông tin tài khoản"
            action={
              editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setSaveError(null); }}
                    className="text-xs text-neutral-400 hover:underline"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {isPending ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Chỉnh sửa
                </button>
              )
            }
          >
            {saveError && (
              <p className="text-xs text-danger mb-3">{saveError}</p>
            )}

            {editing ? (
              <div className="flex flex-col gap-3 text-sm">
                <Field label="Tên">
                  <input
                    value={form.name ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Trường">
                  <input
                    value={form.schoolName ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Năm học">
                  <input
                    value={form.schoolYear ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Mục tiêu / tuần">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.weeklyGoalSessions ?? ""}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      weeklyGoalSessions: e.target.value ? Number(e.target.value) : null,
                    }))}
                    placeholder="Số bài / tuần"
                    className="w-full border border-neutral-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Trình độ">
                  <select
                    value={form.currentLevel ?? ""}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      currentLevel: e.target.value || null,
                    }))}
                    className="w-full border border-neutral-200 rounded-[8px] px-3 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">— Chọn trình độ —</option>
                    <option value="beginner">Mới bắt đầu</option>
                    <option value="intermediate">Đang tiến bộ</option>
                    <option value="advanced">Nâng cao</option>
                  </select>
                </Field>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm">
                {[
                  { label: "Lớp",        value: data.gradeName },
                  { label: "Năm học",    value: data.schoolYear },
                  { label: "Trường",     value: data.schoolName || "—" },
                  { label: "Mục tiêu",  value: data.weeklyGoalSessions ? `${data.weeklyGoalSessions} bài/tuần` : "Chưa đặt" },
                  { label: "Trình độ",  value: data.currentLevel ? (LEVEL_LABELS[data.currentLevel] ?? data.currentLevel) : "Chưa đặt" },
                  { label: "Chủ đề tập trung", value: data.currentFocusTopicName ?? "Chưa đặt" },
                  { label: "Bắt đầu",   value: data.startedAt ? new Date(data.startedAt).toLocaleDateString("vi-VN") : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-neutral-400">{label}</span>
                    <span className="font-medium text-neutral-800 text-right max-w-[180px] truncate">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick history */}
          <SectionCard title="Lịch sử gần đây">
            {data.recentHistory.length > 0 ? (
              <RecentHistory entries={data.recentHistory} />
            ) : (
              <p className="text-sm text-neutral-400 py-2">Chưa có lịch sử.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ── Tiny field wrapper ────────────────────────────────────────────────────────

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
