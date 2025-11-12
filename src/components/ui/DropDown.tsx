"use client";
import * as React from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";
import { cn } from "../../lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const dropdownVariants = cva(
  "inline-flex items-center justify-between border rounded-lg text-sm transition-all duration-200 focus:outline-none gap-4",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-300 text-gray-dark focus:ring-green-default",
        error: "border-pink-dark focus:ring-pink-dark",
      },
      size: {
        sm: "px-2 py-1.5 text-sm",
        default: "px-3 py-2",
        lg: "px-4 py-2.5 text-base",
      },
      width: {
        auto: "w-auto",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "full",
    },
  }
);

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface DropdownProps
  extends VariantProps<typeof dropdownVariants> {
  options: DropdownOption[];
  selected: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  error?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      selected,
      onChange,
      label,
      error,
      variant,
      size,
      width,
      className,
      triggerClassName,
      disabled,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState<'bottom' | 'top'>('bottom');
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const selectedOption = options.find((opt) => opt.value === selected);

    const calculatePosition = React.useCallback(() => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const dropdownHeight = Math.min(options.length * 40 + 16, 240);

      setDropdownPosition(spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top');
    }, [options.length]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
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

      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }, [isOpen, calculatePosition]);

    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen) {
        calculatePosition();
      }
      setIsOpen((prev) => !prev);
    };

    return (
      <div
        ref={(node) => {
          dropdownRef.current = node;
          if (typeof ref === "function") ref(node);
        }}
        className={cn("space-y-1 relative min-w-32", className)}
      >
        {label && (
          <label className="block text-sm font-medium text-gray-dark">
            {label}
          </label>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          className={cn(
            dropdownVariants({ variant: error ? "error" : variant, size, width }),
            disabled ? "cursor-not-allowed" : undefined,
            triggerClassName
          )}
          disabled={disabled}
        >
          {selectedOption?.label ?? "Select"}
          <IconChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute w-full rounded-lg border border-gray-200 bg-white shadow-lg py-1 max-h-60 overflow-y-auto z-10",
              dropdownPosition === 'bottom' ? "top-full" : "bottom-full"
            )}
            style={{
              minWidth: triggerRef.current?.offsetWidth || 'auto',
            }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-light text-center">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-dark hover:bg-gray-100 focus:bg-gray-100 flex justify-between items-center text-left transition-colors duration-150"
                >
                  {option.label}
                  {selected === option.value && (
                    <IconCheck size={16} className="text-green-default" />
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {error && <div className="text-pink-darkest text-sm mt-1">{error}</div>}
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";