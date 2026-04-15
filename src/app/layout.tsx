import type { Metadata } from "next";
import "./globals.css";
import { AppTopbar } from "@/components/shared/AppTopbar";

export const metadata: Metadata = {
  title: "ToánAI – Ứng dụng học Toán tiểu học có AI",
  description:
    "Luyện Toán tiểu học mỗi ngày 10–15 phút, được chấm ngay và biết vì sao mình sai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased">
        <AppTopbar />
        <main className="max-w-[1160px] mx-auto px-5 py-6">{children}</main>
        <footer
          className="text-center py-4 text-xs"
          style={{ color: "rgba(0,43,140,0.35)" }}
        >
          ToánAI · MVP Lớp 2 · Hệ thống học Toán tiểu học có AI
        </footer>
      </body>
    </html>
  );
}
