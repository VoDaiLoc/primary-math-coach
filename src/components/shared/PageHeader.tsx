import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-6 flex-wrap animate-fade-in-up", className)}>
      <div className="flex flex-col gap-1">
        {/* accent line */}
        <div
          className="w-8 h-1 rounded-full mb-1"
          style={{ background: "linear-gradient(90deg, #0F52BA, #282888)" }}
        />
        <h1
          className="text-[22px] font-bold tracking-tight leading-tight"
          style={{
            background: "linear-gradient(135deg, #002B8C 0%, #0F52BA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
