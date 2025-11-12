import React, { useState } from "react";
import { IconPencil, IconX } from "@tabler/icons-react";
import { Button } from "../ui/Button";
import type { QuotationLineItem } from "../../types/common";

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuotationLineItem | null;
  onAddItems: (
    selectedOptions: Array<{
      option: QuotationLineItem["options"][0];
      quantity: number;
    }>
  ) => void;
  onFinalizeSelections?: (
    selections: Record<string, string>
  ) => Promise<void> | void;
  onManualEntry?: (item: QuotationLineItem) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddItems,
  onFinalizeSelections,
  onManualEntry,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  React.useEffect(() => {
    if (isOpen && item) {
      setSelectedOptionId(null);
      setQuantities({});
    }
  }, [isOpen, item?.line_no]);

  if (!isOpen || !item || !item.options || item.options.length === 0)
    return null;

  const handleOptionToggle = (optionId: string) => {
    const next = selectedOptionId === optionId ? null : optionId;
    setSelectedOptionId(next);
    if (next) {
      setQuantities((prev) => ({ ...prev, [next]: item.quantity }));
    }
  };

  const handleAddItems = () => {
    if (!selectedOptionId) return;
    const option = item.options.find((opt) => opt.option_id === selectedOptionId)!;
    const selectedItems = [
      {
        option,
        quantity: quantities[selectedOptionId] || item.quantity,
      },
    ];
    onAddItems(selectedItems);
    if (onFinalizeSelections) {
      const selections: Record<string, string> = { [`${item.line_no}`]: selectedOptionId };
      Promise.resolve(onFinalizeSelections(selections)).finally(() => {});
    }
    onClose();
  };

  const getUnitPrice = (option: QuotationLineItem["options"][0]) => {
    return option.unit_price_piece || option.unit_price_meter || option.lp || 0;
  };

  const openAddItemModal = () => {
    if (item && onManualEntry) {
      onManualEntry(item);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/36 flex items-center justify-center z-[60] p-4">
      <div className="bg-background-light rounded-xl w-full max-w-lg max-h-[100vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-5 pb-2 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-dark flex items-center gap-2">
              Select matching item
              {item?.quantity && (
                <span className="text-sm text-gray-light">
                  (Qty: {item.quantity})
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-light mt-1">
              Multiple selection is not allowed. Choose a single item.
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <IconX className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          <div className="">
            <div className="flex items-center justify-between text-sm font-medium bg-white text-gray-dark border border-border-dark p-2">
              <span className="flex-1">Item description</span>
              <span className="w-24 text-center">Size</span>
              <span className="w-20 text-center">Rate</span>
            </div>

            {item.options.map((option) => (
              <div
                key={option.option_id}
                className={`flex items-center justify-between p-3 border-x border-b border-border-dark cursor-pointer ${
                  selectedOptionId === option.option_id
                    ? "bg-background-light"
                    : "hover:bg-gray-50 bg-white"
                }`}
                onClick={() => handleOptionToggle(option.option_id)}
              >
                <div className="flex items-center flex-1">
                  <input
                    type="radio"
                    name="selection"
                    checked={selectedOptionId === option.option_id}
                    onChange={() => handleOptionToggle(option.option_id)}
                    className="h-4 w-4"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-dark">
                      {option.category}
                    </p>
                    <p className="text-xs text-gray-light">{option.hsn_code}</p>
                  </div>
                </div>
                <div className="w-24 text-center">
                  <span className="text-sm text-gray-dark">{option.size}</span>
                </div>
                <div className="w-20 text-center">
                  <span className="text-sm text-gray-dark">
                    ₹{getUnitPrice(option).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 space-y-2">
          <Button
            onClick={handleAddItems}
            disabled={!selectedOptionId}
            size="sm"
            width="full"
          >
            Confirm Selection
          </Button>
          <Button
            onClick={openAddItemModal}
            size="sm"
            width="full"
            variant="cta"
          >
            <IconPencil size={16} /> Enter manually instead
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
