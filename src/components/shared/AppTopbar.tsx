"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/home",            label: "Trang chủ",  icon: "⬡" },
  { href: "/dashboard",       label: "Dashboard",  icon: "◈" },
  { href: "/student/profile", label: "Hồ sơ",     icon: "◉" },
];

export function AppTopbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "linear-gradient(135deg, #002B8C 0%, #0F52BA 60%, #282888 100%)",
        boxShadow: "0 4px 24px rgba(0,43,140,0.35)",
      }}
    >
      {/* subtle top shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: "linear-gradient(90deg, transparent, #F0FFFF, #0F52BA, transparent)" }}
      />

      <div className="max-w-[1160px] mx-auto px-5 flex items-center justify-between h-14 gap-3">
        {/* Brand */}
        <Link
          href="/home"
          className="group flex items-center gap-2 select-none"
        >
          <span
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base font-black text-[#002B8C] transition-transform duration-200 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg, #F0FFFF 0%, #c8deff 100%)" }}
          >
            T
          </span>
          <span className="text-[18px] font-bold tracking-tight text-white leading-none">
            Toán<span className="text-[#F0FFFF] opacity-80">AI</span>
          </span>
        </Link>

        {isAdmin ? (
          /* ── Admin badge ── */
          <div className="flex items-center gap-2.5">
            <span className="text-white/50 text-sm font-light">/ Admin</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
              Nội bộ
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#002B8C] border-2 border-white/30"
              style={{ background: "linear-gradient(135deg, #F0FFFF, #c8deff)" }}
            >
              AD
            </div>
          </div>
        ) : (
          /* ── User nav ── */
          <nav className="flex items-center gap-0.5" aria-label="App navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative group flex items-center gap-1.5 text-[13px] px-3.5 py-1.5 rounded-[8px]",
                    "transition-all duration-200 font-medium overflow-hidden",
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  )}
                >
                  {/* active indicator dot */}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F0FFFF]" />
                  )}
                  {label}
                </Link>
              );
            })}

            {/* Practice CTA */}
            <Link
              href="/practice/new"
              className="ml-2 flex items-center gap-1.5 text-[13px] px-4 py-1.5 rounded-[8px] font-semibold
                         text-[#002B8C] transition-all duration-200
                         hover:scale-[1.04] hover:shadow-lg active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #F0FFFF 0%, #c8deff 100%)" }}
            >
              + Luyện tập
            </Link>

            {/* Avatar */}
            <div
              className="w-[34px] h-[34px] ml-2 rounded-full flex items-center justify-center text-xs font-bold text-[#002B8C] border-2 border-white/40 cursor-pointer
                         transition-transform duration-200 hover:scale-110"
              style={{ background: "linear-gradient(135deg, #F0FFFF, #c8deff)" }}
            >
              MA
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
