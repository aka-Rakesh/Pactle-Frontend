import React from "react";
import { cn } from "../../lib/cn";
import type { LoadingProps } from "../../types/common";
import { IconLoader2 } from "@tabler/icons-react";

const sizeMap: Record<string, string> = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-20 w-20",
};

export const Loading: React.FC<LoadingProps> = ({
  message,
  subMessage,
  size = "md",
  fullscreen = false,
}) => {
  const containerClasses = cn(
    "flex flex-col items-center justify-center text-center space-y-4",
    fullscreen && "min-h-screen"
  );

  const isPredefined = typeof size === "string" && sizeMap[size];
  const iconClasses = cn("animate-spin text-gray-light", isPredefined && sizeMap[size as string]);

  const iconStyle = !isPredefined
    ? { width: size, height: size }
    : undefined;

  return (
    <div className={containerClasses}>
      <IconLoader2
        stroke={2}
        className={iconClasses}
        style={iconStyle}
      />

      {(message || subMessage) && (
        <div>
          {message && <p className="text-lg font-medium">{message}</p>}
          {subMessage && (
            <p className="text-sm text-gray-light max-w-sm">{subMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};
