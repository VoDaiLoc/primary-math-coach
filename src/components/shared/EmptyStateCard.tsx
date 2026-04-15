import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-dashed border-primary/20 rounded-[12px] bg-white px-8 py-10 flex flex-col items-center text-center gap-3 animate-fade-in",
        className
      )}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{ background: "linear-gradient(135deg, #e8effe 0%, #F0FFFF 100%)", color: "#0F52BA" }}
      >
        {icon}
      </div>
      <p className="text-[15px] font-semibold text-neutral-700">{title}</p>
      <p className="text-sm text-neutral-400 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
