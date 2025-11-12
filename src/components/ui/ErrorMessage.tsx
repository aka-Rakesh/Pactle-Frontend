import React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <IconAlertCircle className="w-5 h-5 text-red-500" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage; 