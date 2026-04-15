import { PageHeader } from "@/components/shared/PageHeader";
import { PracticeConfigForm } from "@/features/practice/components/PracticeConfigForm";
import { mockGradeConfigs, mockTopics } from "@/lib/mock-data";
import type { PracticeConfigResponse } from "@/types/api";

async function fetchConfig(): Promise<PracticeConfigResponse> {
  try {
    // Absolute URL required for server-side fetch in Next.js
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/practice/config`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    // Fall through to mock data below
  }
  // Fallback to mock data when DB is not available (dev without seed)
  return { grades: mockGradeConfigs, topics: mockTopics };
}

export default async function PracticeNewPage() {
  const { grades, topics } = await fetchConfig();

  return (
    <div>
      <PageHeader
        title="Chọn bài luyện tập"
        subtitle="Tùy chỉnh theo nhu cầu và bắt đầu luyện"
      />
      <PracticeConfigForm grades={grades} topics={topics} />
    </div>
  );
}
