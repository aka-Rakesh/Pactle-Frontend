import React from "react";
import type { AlertCardProps } from "../../types/common";
import { Button } from "../ui/Button";
import { IconCalendarEvent, IconX } from "@tabler/icons-react";

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction, onClose }) => {
  const getAlertStyles = (type: string) => {
    switch (type) {
      case "quote_delayed":
        return {
          container: "bg-pink-default border-pink-dark",
          button: "bg-pink-darkest hover:bg-pink-dark text-white",
        };
      case "quote_confirmation":
        return {
          container: "bg-yellow-50 border-yellow-200",
          button: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          button: "bg-gray-600 hover:bg-gray-700 text-white",
        };
    }
  };

  const styles = getAlertStyles(alert?.type);

  return (
    <div className={`shadow-md p-4 rounded-lg border ${styles.container} relative`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-light hover:text-gray-dark"
        >
          <IconX className="w-4 h-4" />
        </button>
      )}
      <div className="text-sm space-y-3">
        <h4 className="font-semibold text-gray-dark mb-1">{alert?.title}</h4>
        <p className="text-gray-light">{alert?.description}</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <IconCalendarEvent className="w-4 h-4 text-gray-light" />
            <span className="text-xs text-gray-light">{alert?.date}</span>
          </div>
          {alert?.action && onAction && (
            <Button
              onClick={onAction}
              className={`text-xs font-medium px-3 py-2 rounded transition-colors ${styles.button}`}
            >
              {alert.action}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;