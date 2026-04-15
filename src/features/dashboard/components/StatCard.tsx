"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default:  { value: "text-neutral-900", card: "bg-white" },
  primary:  { value: "text-primary",     card: "bg-primary-light" },
  success:  { value: "text-success",     card: "bg-success-light" },
  warning:  { value: "text-warning",     card: "bg-warning-light" },
};

export function StatCard({ label, value, sub, variant = "default" }: StatCardProps) {
  const s = variantStyles[variant];
  return (
    <div className={cn("border border-neutral-200 rounded-[14px] p-5 flex flex-col gap-1", s.card)}>
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">{label}</p>
      <p className={cn("text-[32px] font-extrabold leading-none tracking-tight", s.value)}>{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}
