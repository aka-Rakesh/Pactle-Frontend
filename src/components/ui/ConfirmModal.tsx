import React from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "default"
    | "danger"
    | "outline"
    | "ghost"
    | "back"
    | "close";
  onConfirm: () => void;
  onCancel: () => void;
  isConfirmLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isConfirmLoading = false,
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/36" onClick={onCancel} />
      <div className="relative bg-background-light rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-dark mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-light mb-8 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="cta"
            onClick={onCancel}
            disabled={isConfirmLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirmLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export default ConfirmModal;
