import * as React from "react";
import { cn } from "../../lib/cn";
import { Input, type InputProps } from "./Input";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

export interface PasswordInputProps extends InputProps {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-11.5 right-3 flex items-center text-gray-light hover:text-gray-dark"
          tabIndex={-1}
        >
          {showPassword ? (
            <IconEyeOff size={18} stroke={1.5} />
          ) : (
            <IconEye size={18} stroke={1.5} />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
