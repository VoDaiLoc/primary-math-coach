"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Create Supabase auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/confirm`,
        data: { name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create DB user record (authId = Supabase UID, role = PARENT by default)
    if (data.user) {
      await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ authId: data.user.id, email, name }),
      });
    }

    setDone(true);
    setLoading(false);

    // If email confirmation disabled → session already exists, go to /home
    if (data.session) {
      router.push("/home");
      router.refresh();
    }
  }

  if (done && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-lg font-bold text-neutral-800 mb-2">Kiểm tra email của bạn</h2>
          <p className="text-sm text-neutral-500">
            Chúng tôi vừa gửi một đường dẫn xác nhận đến <strong>{email}</strong>.
            Nhấn vào đó để hoàn tất đăng ký.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-primary font-semibold hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] mb-4"
            style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
          >
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-800">Tạo tài khoản</h1>
          <p className="text-sm text-neutral-500 mt-1">Đăng ký để bắt đầu học Toán</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Họ và tên (phụ huynh)
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nguyễn Văn A"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0F52BA, #002B8C)" }}
          >
            {loading ? "Đang đăng ký…" : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
