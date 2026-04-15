import { cn } from "@/lib/utils";

interface VariantTagProps {
  variant?: "filled" | "empty";
  children: React.ReactNode;
  className?: string;
}

export function VariantTag({ variant = "empty", children, className }: VariantTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
        variant === "filled"
          ? "bg-primary text-white"
          : "bg-neutral-100 text-neutral-500",
        className
      )}
    >
      {children}
    </span>
  );
}
