import React from "react";
import { IconX, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "./Button";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Error",
  message,
  buttonText = "Go Back & Fix",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/36"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <IconAlertCircle className="h-6 w-6 text-pink-dark" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="default"
          >
            <IconX className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="default"
            size="default"
            className="px-6"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
