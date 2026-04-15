import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionVariant = "default" | "primary" | "success" | "warning";

interface SectionCardProps {
  title?: string;
  variant?: SectionVariant;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const variantStyles: Record<SectionVariant, string> = {
  default:  "bg-white border-neutral-200/80 shadow-sm hover:shadow-md",
  primary:  "bg-primary-light border-primary/20 shadow-sm",
  success:  "bg-success-light border-success/30",
  warning:  "bg-warning-light border-warning/30",
};

export function SectionCard({
  title,
  variant = "default",
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn("border transition-shadow duration-200 animate-fade-in-up", variantStyles[variant], className)}>
      {(title || action) && (
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
          {title && (
            <div className="flex items-center gap-2">
              <span
                className="w-1 h-4 rounded-full flex-shrink-0"
                style={{ background: "linear-gradient(180deg, #0F52BA, #282888)" }}
              />
              <CardTitle className="text-[15px] font-semibold text-neutral-800">
                {title}
              </CardTitle>
            </div>
          )}
          {action && <div className="ml-auto">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
