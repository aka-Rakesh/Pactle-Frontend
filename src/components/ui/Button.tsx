import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-green-darkest text-white hover:bg-green-dark",
        cta: "bg-green-darkest/16 text-green-darkest hover:bg-green-darkest/30 border border-green-darkest",
        destructive: "bg-pink-button text-white hover:bg-pink-dark",
        outline:
          "border border-gray-dark bg-transparent text-gray-dark hover:bg-gray-50",
        ghost: "text-gray-dark",
        link: "text-green-dark underline-offset-4 hover:underline",
        success: "bg-green text-white hover:bg-green-dark",
        close: "bg-white text-black-custom hover:bg-gray-50",
        back: "bg-white text-black-custom border border-border-dark hover:bg-gray-50",
        statcard: "bg-artichoke hover:bg-artichoke/90 text-white",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "h-10 w-10",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "auto",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      width,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, width }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full mr-2" />
        ) : null}
        <div className="flex items-center justify-center gap-2">{children}</div>
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
