import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const inputVariants = cva(
  "w-full px-3 py-1 border rounded-lg text-gray-dark placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:ring-green-default bg-white",
        error: "border-pink-dark focus:ring-pink-dark bg-white",
        search: "pl-9 pr-3 py-2 w-full focus:ring-green-light bg-white border-border-dark",
        searchDark: "pl-9 pr-3 py-2 w-full focus:ring-green-light bg-background-light border-border-dark",
        searchDarkest: "pl-9 pr-3 py-2 w-full focus:ring-green-light bg-background-dark border-border-dark",
        disable: "py-2 w-full bg-background-dark border-border-dark",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
  size?: any;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, error, label, id, ...props }, ref) => {
    const inputId = id;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-dark"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({
              variant: hasError ? "error" : variant,
              size,
              className,
            })
          )}
          {...props}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
