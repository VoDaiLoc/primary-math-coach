"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/home";
  const urlError     = searchParams.get("error");

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(
    urlError === "invalid_token" ? "Đường dẫn xác thực không hợp lệ hoặc đã hết hạn." :
    urlError === "forbidden"     ? "Bạn không có quyền truy cập trang đó."            : null,
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] mb-4"
          style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
        >
          <span className="text-white text-2xl font-bold">T</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-800">Toán AI</h1>
        <p className="text-sm text-neutral-500 mt-1">Đăng nhập vào tài khoản</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="ten@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-500">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
