import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-content-center gap-1.5 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary hover:bg-primary/90",
        secondary:
          "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200",
        outline:
          "border border-primary bg-transparent text-primary hover:bg-primary-light",
        ghost:
          "bg-transparent text-neutral-500 hover:bg-neutral-100",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-success text-white shadow-success hover:bg-success/90",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "px-3.5 py-1.5 text-[13px]",
        lg: "px-7 py-3.5 text-[15px]",
        icon: "h-9 w-9 p-0 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
