import React from "react";
import { useDashboardStore } from "../../stores";
import type {
  TimeRangeOption,
  TimeRangeSelectorProps,
  TimeRangeParams,
} from "../../types/common";
import { IconFilePlus } from "@tabler/icons-react";
import { Button } from "../ui/Button";
import DatePicker from "../ui/DatePicker";
import { getTimeRangeDates } from "../../utils/dateUtils";

const timeRangeOptions: TimeRangeOption[] = [
  { key: "7days", label: "7 days" },
  { key: "30days", label: "30 days" },
  { key: "4months", label: "4 months" },
  { key: "custom", label: "Custom range" },
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  buttonLabel,
  onButtonClick,
  onTimeRangeChange,
}) => {
  const { timeRange, setTimeRange } = useDashboardStore();

  const toIsoYmd = (dmy: string | undefined): string | undefined => {
    if (!dmy) return undefined;
    const parts = dmy.split("-");
    if (parts.length !== 3) return undefined;
    const [dd, mm, yyyy] = parts;
    if (!yyyy || !mm || !dd) return undefined;
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDateRangeChange = (_field: string, value: string | [string, string]) => {
    if (onTimeRangeChange) {
      const start = Array.isArray(value) ? value[0] : undefined;
      const end = Array.isArray(value) ? value[1] : undefined;
      const params: TimeRangeParams = {
        start_date: toIsoYmd(start),
        end_date: toIsoYmd(end),
      };
      onTimeRangeChange(params);
    }
  };

  const handleTimeRangeChange = (rangeKey: string) => {
    setTimeRange(rangeKey);
    if (onTimeRangeChange && rangeKey !== "custom") {
      const { startDate, endDate } = getTimeRangeDates(rangeKey);
      const params: TimeRangeParams = {
        start_date: startDate,
        end_date: endDate,
      };
      onTimeRangeChange(params);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
      <div className="flex flex-wrap w-full sm:w-auto p-2 sm:p-1 bg-background-light rounded-lg border border-border-dark">
        {timeRangeOptions.map((range, index) => {
          if (range.key === "custom" && timeRange === "custom") {
            return (
              <div
                key="custom-date"
                className="transition-all duration-200 ease-in-out w-full sm:w-auto"
              >
                <DatePicker range onChange={handleDateRangeChange} size={"sm"} />
              </div>
            );
          }

          return (
            <button
              key={range.key}
              onClick={() => handleTimeRangeChange(range.key)}
              className={`px-3 py-2 sm:py-1.5 w-full sm:w-auto text-left sm:text-center text-sm font-medium transition-colors rounded-md ${
                timeRange === range.key
                  ? "bg-background-dark text-gray-dark rounded-md"
                  : "text-gray-light hover:text-gray-dark"
              } ${index !== 0 ? "sm:border-l sm:border-border-dark" : ""}`}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      {buttonLabel && (
        <Button onClick={onButtonClick} variant={"cta"}>
          <IconFilePlus className="w-4 h-4" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};

export default TimeRangeSelector;
