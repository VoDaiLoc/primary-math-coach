"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <label className={cn("flex items-center gap-2 cursor-pointer select-none", disabled && "opacity-50 pointer-events-none")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-success" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-1"
          )}
        />
      </button>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  );
}
