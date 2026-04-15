"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { SkillProgressList } from "@/features/dashboard/components/SkillProgressList";
import { ChartPlaceholder } from "@/features/dashboard/components/ChartPlaceholder";
import { HistoryRow } from "@/features/dashboard/components/HistoryRow";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";
import type { DashboardSummaryResponse } from "@/types/api";

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu.");
        return res.json() as Promise<DashboardSummaryResponse>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-neutral-400">Đang tải...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-danger">{error ?? "Đã xảy ra lỗi."}</p>
      </div>
    );
  }

  const { student, stats, weeklyStats, topicProgress, strongTopics, weakTopics, recentHistory, recommendations } = data;

  const bestSkill = [...topicProgress].sort((a, b) => b.accuracy - a.accuracy)[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard phụ huynh"
        subtitle={`Theo dõi tiến độ của ${student.name}`}
        action={
          <Link
            href="/student/profile"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Xem hồ sơ →
          </Link>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Tổng bài đã làm"
          value={stats.totalSubmissions}
          variant="primary"
          sub="Tất cả thời gian"
        />
        <StatCard
          label="Độ chính xác TB"
          value={`${stats.averageAccuracy}%`}
          variant="success"
          sub={`${stats.totalCorrectAnswers}/${stats.totalQuestionsAnswered} câu đúng`}
        />
        <StatCard
          label="Chủ đề đã học"
          value={stats.trackedTopicsCount}
          sub={student.gradeName}
        />
        <StatCard
          label="Điểm mạnh nhất"
          value={bestSkill ? `${bestSkill.accuracy}%` : "—"}
          variant="warning"
          sub={bestSkill?.topicName ?? "Chưa có dữ liệu"}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: chart + history */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Hoạt động theo tuần (số bài)">
            {weeklyStats.some((w) => w.sessionCount > 0) ? (
              <ChartPlaceholder data={weeklyStats} />
            ) : (
              <EmptyStateCard
                icon="📊"
                title="Chưa có dữ liệu"
                description="Biểu đồ sẽ hiện sau khi học sinh làm bài."
              />
            )}
          </SectionCard>

          <SectionCard title="Lịch sử bài làm">
            {recentHistory.length > 0 ? (
              <div>
                {recentHistory.map((e) => (
                  <HistoryRow key={e.id} entry={e} />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon="📝"
                title="Chưa có lịch sử"
                description="Lịch sử bài làm sẽ xuất hiện sau khi học sinh hoàn thành bài."
              />
            )}
          </SectionCard>
        </div>

        {/* Right: skill progress + weak/strong + recommendations */}
        <div className="space-y-5">
          <SectionCard title="Tiến độ kỹ năng" contentClassName="pt-2">
            {topicProgress.length > 0 ? (
              <SkillProgressList skills={topicProgress} />
            ) : (
              <EmptyStateCard
                icon="🎯"
                title="Chưa có dữ liệu"
                description="Làm bài để xem tiến độ kỹ năng."
              />
            )}
          </SectionCard>

          {weakTopics.length > 0 && (
            <SectionCard title="Cần luyện thêm">
              <div className="flex flex-col gap-2">
                {weakTopics.slice(0, 3).map((t) => (
                  <div key={t.topicId} className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-700 truncate max-w-[70%]">{t.topicName}</span>
                    <span className="text-xs font-bold text-danger">{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {strongTopics.length > 0 && (
            <SectionCard title="Điểm mạnh">
              <div className="flex flex-col gap-2">
                {strongTopics.slice(0, 3).map((t) => (
                  <div key={t.topicId} className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-700 truncate max-w-[70%]">{t.topicName}</span>
                    <span className="text-xs font-bold text-success">{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {recommendations.length > 0 && (
            <SectionCard title="Gợi ý luyện tập">
              <div className="flex flex-col gap-2">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/practice/new?topicId=${rec.topicId}`}
                    className="flex flex-col gap-0.5 p-3 rounded-[10px] border border-neutral-100 hover:border-primary/40 hover:bg-primary-light transition-colors"
                  >
                    <p className="text-sm font-semibold text-neutral-800 truncate">{rec.title}</p>
                    <p className="text-xs text-neutral-400">{rec.description}</p>
                  </Link>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
