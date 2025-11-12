import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const phoneInputVariants = cva(
  "w-full px-3 py-1 border rounded-lg text-gray-dark placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:ring-green-default bg-white",
        error: "border-pink-dark focus:ring-pink-dark bg-white",
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

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size">,
    VariantProps<typeof phoneInputVariants> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  maxDigits?: number;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label, error, variant, size, className, id, maxDigits = 10, ...rest }, ref) => {
    const inputId = id ?? React.useId();
    const [internalValue, setInternalValue] = React.useState<string>(value ?? "");

    React.useEffect(() => {
      setInternalValue(value ?? "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digitsOnly = e.target.value.replace(/\D+/g, "").slice(0, maxDigits);
      setInternalValue(digitsOnly);
      onChange(digitsOnly);
    };

    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-dark">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={internalValue}
          onChange={handleChange}
          maxLength={maxDigits}
          className={cn(
            phoneInputVariants({
              variant: hasError ? "error" : variant,
              size,
              className,
            })
          )}
          {...rest}
        />
        {hasError && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;


