import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const numberInputVariants = cva(
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
        default: "px-4 py-2",
        lg: "px-4 py-2.5 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NumberInputProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "value" | "onChange" | "size"
    >,
    VariantProps<typeof numberInputVariants> {
  value: number | string;
  onChange: (value: number) => void;
  error?: string;
  label?: string;
  decimalPlaces?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      label,
      error,
      variant,
      size,
      className,
      id,
      decimalPlaces,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const formatWithDecimals = (val: number | string) => {
      const num = typeof val === "number" ? val : parseFloat(val);
      if (Number.isFinite(num) && typeof decimalPlaces === "number") {
        return num.toFixed(decimalPlaces);
      }
      return String(val);
    };

    const [internalValue, setInternalValue] = React.useState<string>(
      formatWithDecimals(value)
    );

    React.useEffect(() => {
      setInternalValue(formatWithDecimals(value));
    }, [value, decimalPlaces]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      if (val === "") {
        setInternalValue(val);
        onChange(0);
        return;
      }

      // Validate numeric format
      const regex =
        typeof decimalPlaces === "number"
          ? new RegExp(`^\\d*\\.?\\d{0,${decimalPlaces}}$`)
          : /^\d*\.?\d*$/;
      if (!regex.test(val)) return;

      const [intPart] = val.split(".");
      if (intPart.length > 9) return;

      // Remove leading zeros unless decimal
      if (
        intPart.length > 1 &&
        intPart.startsWith("0") &&
        !val.startsWith("0.")
      ) {
        val = val.replace(/^0+/, "");
      }

      const minNum =
        rest.min !== undefined ? parseFloat(String(rest.min)) : undefined;
      const maxNum =
        rest.max !== undefined ? parseFloat(String(rest.max)) : undefined;

      const num = parseFloat(val);
      if (!isNaN(num)) {
        let nextNum = num;
        if (typeof minNum === "number" && !isNaN(minNum) && nextNum < minNum)
          nextNum = minNum;
        if (typeof maxNum === "number" && !isNaN(maxNum) && nextNum > maxNum)
          nextNum = maxNum;

        const nextStr =
          typeof decimalPlaces === "number"
            ? nextNum.toFixed(decimalPlaces)
            : String(nextNum);
        setInternalValue(nextStr);
        onChange(nextNum);
      } else {
        setInternalValue(val);
      }
    };

    const handleBlur = () => {
      const num = parseFloat(internalValue);
      if (!isNaN(num)) {
        const minNum =
          rest.min !== undefined ? parseFloat(String(rest.min)) : undefined;
        const maxNum =
          rest.max !== undefined ? parseFloat(String(rest.max)) : undefined;
        let nextNum = num;
        if (typeof minNum === "number" && !isNaN(minNum) && nextNum < minNum)
          nextNum = minNum;
        if (typeof maxNum === "number" && !isNaN(maxNum) && nextNum > maxNum)
          nextNum = maxNum;
        setInternalValue(formatWithDecimals(nextNum));
        if (nextNum !== num) onChange(nextNum);
      } else {
        setInternalValue(formatWithDecimals(value));
      }
    };

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
          ref={ref}
          id={inputId}
          type="text"
          inputMode="decimal"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            numberInputVariants({
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

NumberInput.displayName = "NumberInput";
