import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        primary:  "bg-primary-light text-primary",
        success:  "bg-success-light text-success-foreground",
        warning:  "bg-warning-light text-warning-foreground",
        danger:   "bg-danger-light text-danger-foreground",
        neutral:  "bg-neutral-100 text-neutral-500",
        default:  "bg-primary text-primary-foreground",
        outline:  "border border-neutral-300 text-neutral-600",
      },
    },
    defaultVariants: { variant: "primary" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
