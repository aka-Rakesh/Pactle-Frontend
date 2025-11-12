import React, { useMemo } from "react";
import { Button } from "../ui/Button";
import type { StatCardProps } from "../../types/common";

const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  subtitle,
  action,
  onAction,
  icon: Icon,
  variant = "default",
  isLoading = false,
}) => {
  const formattedValue = useMemo(() => {
    if (variant === "currency" && typeof value === "number") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      })
        .format(value)
        .replace("₹", "");
    }
    return value;
  }, [value, variant]);

  return (
    <div className="bg-background-light rounded-lg border border-border-dark p-6 hover:shadow-sm transition-shadow flex flex-col gap-3 justify-between">
      <div className="flex items-center justify-between">
        {isLoading ? (
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        ) : (
          <h3 className="text-sm font-medium text-gray-dark">{title}</h3>
        )}
        {Icon && <Icon className="w-4 h-4 text-gray-light" />}
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-gray-dark">
              {formattedValue}
            </span>
            {subtitle && <p className="text-xs text-gray-light">{subtitle}</p>}
          </>
        )}
      </div>
      {!isLoading && action && onAction && (
        <Button
          onClick={onAction}
          variant="statcard"
        >
          {action}
        </Button>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
