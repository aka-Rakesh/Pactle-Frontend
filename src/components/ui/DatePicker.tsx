import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const datePickerVariants = cva(
  "flex items-center justify-between cursor-pointer border rounded-lg bg-white transition-all",
  {
    variants: {
      variant: {
        default:
          "border-gray-300 text-gray-dark focus-within:ring-green-default",
        error: "border-pink-dark text-pink-dark focus-within:ring-pink-dark",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        default: "px-4 py-2 text-sm",
        lg: "px-4 py-2.5 text-base",
      },
      width: {
        full: "w-full",
        auto: "w-auto",
        fit: "w-fit",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "auto",
    },
  }
);

export interface DayObj {
  day: number;
  isCurrentMonth: boolean;
  isNextMonth: boolean;
  date: Date;
}

export interface DatePickerProps extends VariantProps<typeof datePickerVariants> {
  onChange: (field: string, value: string | [string, string]) => void;
  className?: string;
  range?: boolean;
  field?: string;
  value?: string;
  label?: string;
  error?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  onChange,
  className = "",
  range = false,
  variant,
  size,
  width,
  field = "date",
  value,
  label,
  error,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsedDate = new Date(value);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  });
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsedDate = new Date(value);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  });
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = 400;

    setDropdownPosition(spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top');
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
        setViewDate(parsedDate);
      }
    }
  }, [value]);

  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

  const getDaysInMonth = (date: Date): DayObj[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days: DayObj[] = [];

    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isNextMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isNextMonth: false,
        date: new Date(year, month, day),
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNextMonth: true,
        date: new Date(year, month + 1, day),
      });
    }

    return days;
  };

  const isToday = (date: Date) =>
    new Date().toDateString() === date.toDateString();

  const isSelectedDate = (date: Date) =>
    !range && currentDate.toDateString() === date.toDateString();

  const isInRange = (date: Date) => {
    if (!range || !rangeStart || !rangeEnd) return false;
    return (
      date.getTime() >= rangeStart.getTime() &&
      date.getTime() <= rangeEnd.getTime()
    );
  };

  const handleSelect = (date: Date) => {
    if (range) {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
      } else if (date < rangeStart) {
        setRangeStart(date);
        setRangeEnd(rangeStart);
      } else {
        setRangeEnd(date);
        onChange(field, [formatDate(rangeStart), formatDate(date)]);
        setIsOpen(false);
      }
    } else {
      setCurrentDate(date);
      onChange(field, formatDate(date));
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  const renderLabel = () => {
    if (range && rangeStart && rangeEnd)
      return `${formatDate(rangeStart)} → ${formatDate(rangeEnd)}`;
    if (range && rangeStart) return `${formatDate(rangeStart)} → …`;
    return formatDate(currentDate);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-dark">
          {label}
        </label>
      )}
      <div className="relative" ref={ref}>
        <div
          ref={triggerRef}
          onClick={handleToggle}
          className={cn(
            datePickerVariants({ variant: error ? "error" : variant, size, width }),
            className
          )}
        >
          <span className="text-sm truncate">{renderLabel()}</span>
          <IconCalendar size={16} className="text-gray-light ml-2 flex-shrink-0" />
        </div>

        {isOpen && (
          <div 
            className={cn(
              "absolute z-[9999] w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4",
              dropdownPosition === 'bottom' ? "top-full mt-1" : "bottom-full mb-1",
              width === "full" ? "left-0" : "right-0"
            )}
            style={{
              minWidth: triggerRef.current?.offsetWidth || 'auto',
            }}
          >
            {/* Year Navigation */}
            <div className="flex justify-center items-center mb-3">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setFullYear(viewDate.getFullYear() - 1))
                  )
                }
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="mx-4 font-semibold text-lg min-w-[4rem] text-center">
                {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setFullYear(viewDate.getFullYear() + 1))
                  )
                }
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <IconChevronRight size={16} />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setMonth(viewDate.getMonth() - 1))
                  )
                }
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="font-medium min-w-[10rem] text-center">
                {viewDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setMonth(viewDate.getMonth() + 1))
                  )
                }
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <IconChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center text-xs text-gray-light font-medium mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="p-2">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(viewDate).map((dayObj, idx) => {
                const isSelected =
                  isSelectedDate(dayObj.date) || isInRange(dayObj.date);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(dayObj.date)}
                    className={cn(
                      "p-1.5 text-sm rounded transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-light",
                      !dayObj.isCurrentMonth && "text-gray-light",
                      isSelected && "bg-green-default text-white hover:bg-green-dark",
                      isToday(dayObj.date) && !isSelected && "bg-blue-100 text-blue-darkest",
                      !isSelected && !isToday(dayObj.date) && "text-gray-dark",
                    )}
                  >
                    {dayObj.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default DatePicker;