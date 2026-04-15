import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={<div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 h-96 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
