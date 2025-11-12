import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const textAreaVariants = cva(
  "w-full px-3 py-2 border rounded-lg text-gray-dark placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:ring-green-default bg-white",
        error: "border-pink-dark focus:ring-pink-dark bg-white",
        disable: "border-border-dark bg-background-dark",
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

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {
  error?: string;
  label?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, variant, size, error, label, id, rows = 3, ...props }, ref) => {
    const inputId = id ?? React.useId();
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-dark">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={cn(
            textAreaVariants({
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

TextArea.displayName = "TextArea";

export { TextArea, textAreaVariants };


