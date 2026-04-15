"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// Tab key → Vietnamese display label
const TAB_LABELS: Record<string, string> = {
  "lop":           "Lớp",
  "chu-de":        "Chủ đề",
  "ky-nang":       "Kỹ năng",
  "blueprint":        "Blueprint",
  "quy-tac-kiem-tra": "Quy tắc kiểm tra",
  "mau-prompt-ai":    "Mẫu prompt AI",
  "ngan-hang-cau-hoi":    "Ngân hàng câu hỏi",
  "cau-hoi-ai-cho-duyet": "Câu hỏi AI chờ duyệt",
  "import-csv":           "Import CSV",
  "ngan-hang-de": "Ngân hàng đề",
  "tao-de":       "Tạo đề",
  "cau-hinh-phat-hanh": "Cấu hình phát hành",
};

// Section icons (emoji used as simple icons)
const SECTION_ICONS: Record<string, string> = {
  "Chương trình học":  "📚",
  "Nội dung câu hỏi": "✏️",
  "Ngân hàng câu hỏi": "🗂️",
  "Ngân hàng đề":     "📋",
  "Phát hành":        "🚀",
};

const NAV: { label: string; tabs: string[] }[] = [
  { label: "Chương trình học",  tabs: ["lop", "chu-de", "ky-nang"] },
  { label: "Nội dung câu hỏi", tabs: ["blueprint", "quy-tac-kiem-tra", "mau-prompt-ai"] },
  { label: "Ngân hàng câu hỏi", tabs: ["ngan-hang-cau-hoi", "cau-hoi-ai-cho-duyet", "import-csv"] },
  { label: "Ngân hàng đề",     tabs: ["ngan-hang-de", "tao-de"] },
];

const DEFAULT_TAB = "lop";

interface AdminSidebarProps {
  activeTab?: string;
}

export function AdminSidebar({ activeTab }: AdminSidebarProps) {
  const current = activeTab ?? DEFAULT_TAB;

  return (
    <aside
      className="w-full lg:w-[230px] flex-shrink-0 rounded-[16px] p-4 flex flex-col gap-0.5 self-start overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #002B8C 0%, #0d1f6e 60%, #282888 100%)",
        boxShadow: "0 8px 32px rgba(0,43,140,0.30)",
      }}
    >
      {/* Header */}
      <div className="px-2 pb-3 mb-1 border-b border-white/10">
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">
          Quản trị hệ thống
        </p>
      </div>

      {NAV.map((section, si) => (
        <div key={section.label} className="flex flex-col gap-0.5">
          {/* Section header */}
          <div className="flex items-center gap-1.5 px-2 pt-3 pb-1.5">
            <span className="text-[13px] leading-none">
              {SECTION_ICONS[section.label] ?? "•"}
            </span>
            <p className="text-[10px] font-bold text-white/45 uppercase tracking-[0.12em]">
              {section.label}
            </p>
          </div>

          {section.tabs.map((tabKey) => {
            const isActive = current === tabKey;
            return (
              <Link
                key={tabKey}
                href={`/admin/content?tab=${tabKey}`}
                className={cn(
                  "relative flex items-center gap-2 text-[13px] px-3 py-2 rounded-[9px]",
                  "transition-all duration-200 group overflow-hidden",
                  isActive
                    ? "text-white font-semibold shadow-primary"
                    : "text-white/55 hover:text-white/90 hover:bg-white/8",
                )}
                style={isActive ? {
                  background: "linear-gradient(135deg, rgba(15,82,186,0.9) 0%, rgba(40,40,136,0.7) 100%)",
                  boxShadow: "0 2px 12px rgba(15,82,186,0.40)",
                } : {}}
              >
                {/* Active left accent bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full transition-all duration-200",
                    isActive ? "bg-[#F0FFFF] opacity-100" : "opacity-0 group-hover:opacity-40 group-hover:bg-white",
                  )}
                />
                <span className="pl-1">{TAB_LABELS[tabKey] ?? tabKey}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* footer version + logout */}
      <div className="mt-4 pt-3 border-t border-white/10 px-2 flex flex-col gap-2">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left text-[12px] text-white/50 hover:text-white/80 transition-colors px-1 py-1 rounded"
          >
            ↩ Đăng xuất
          </button>
        </form>
        <p className="text-[10px] text-white/25">v0.1 — MVP nội bộ</p>
      </div>
    </aside>
  );
}
