"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { InProgressBanner } from "@/features/home/components/InProgressBanner";
import { StudentQuickView } from "@/features/home/components/StudentQuickView";
import { TodaySuggestions } from "@/features/home/components/TodaySuggestions";
import { RecentHistory } from "@/features/home/components/RecentHistory";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";
import type { HomeSummaryResponse } from "@/types/api";

export default function HomePage() {
  const [data, setData]       = useState<HomeSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home/summary")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu.");
        return res.json() as Promise<HomeSummaryResponse>;
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

  const { student, stats, inProgress, recentHistory, recommendations, weeklyStats } = data;

  const weeklyCount    = weeklyStats.reduce((s, w) => s + w.sessionCount, 0);
  const weeklyAccuracy = weeklyStats.some((w) => w.sessionCount > 0)
    ? Math.round(
        weeklyStats
          .filter((w) => w.sessionCount > 0)
          .reduce((s, w) => s + w.accuracy, 0) /
          weeklyStats.filter((w) => w.sessionCount > 0).length,
      )
    : stats.averageAccuracy;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Chào ${student.name.split(" ").pop()}! 👋`}
        subtitle="Hôm nay bạn muốn luyện gì?"
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/practice/new"
              className="inline-flex items-center px-5 py-2.5 rounded-[10px] text-white text-sm font-semibold
                         transition-all duration-200 hover:scale-[1.04] hover:shadow-primary-lg active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #0F52BA 0%, #002B8C 100%)", boxShadow: "0 4px 14px rgba(15,82,186,0.40)" }}
            >
              + Luyện tập mới
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1 rounded"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        }
      />

      {/* Student quick view */}
      <StudentQuickView
        student={student}
        weeklyCount={weeklyCount}
        weeklyAccuracy={weeklyAccuracy}
      />

      {/* In-progress banner */}
      {inProgress && <InProgressBanner exam={inProgress} />}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gợi ý hôm nay */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Gợi ý luyện tập hôm nay"
            action={
              <Link href="/practice/new" className="text-xs text-primary font-semibold hover:underline">
                Tất cả →
              </Link>
            }
          >
            {recommendations.length > 0 ? (
              <TodaySuggestions suggestions={recommendations} />
            ) : (
              <EmptyStateCard
                icon="📚"
                title="Chưa có gợi ý"
                description="Hệ thống sẽ phân tích kết quả và đề xuất bài luyện phù hợp."
              />
            )}
          </SectionCard>
        </div>

        {/* Lịch sử gần đây */}
        <div>
          <SectionCard
            title="Lịch sử gần đây"
            action={
              <Link href="/dashboard" className="text-xs text-primary font-semibold hover:underline">
                Xem tất cả →
              </Link>
            }
          >
            {recentHistory.length > 0 ? (
              <RecentHistory entries={recentHistory} />
            ) : (
              <EmptyStateCard
                icon="📝"
                title="Chưa có lịch sử"
                description="Làm bài đầu tiên để xem lịch sử tại đây."
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}



