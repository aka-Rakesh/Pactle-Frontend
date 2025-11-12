import { IconPlus, IconX } from "@tabler/icons-react";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import type {
  ItemFormData,
  ItemModalProps,
  QuotationItem,
  SKUItem,
} from "../../types/common";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { NumberInput } from "../ui/NumberInput";
import SKUDropdown from "../ui/SKUDropdown";
import { TextArea } from "../ui/TextArea";
import { Dropdown } from "../ui/DropDown";

const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  title = "Add item manually",
}) => {
  const initialFormData: ItemFormData = useMemo(
    () => {
      let categoryValue = item?.original_description || item?.category || "";
      if (!categoryValue && item?.material_type) {
        const parts = [];
        if (item.material_type) parts.push(item.material_type);
        if (item.size_specification) parts.push(item.size_specification);
        categoryValue = parts.join(" ");
      }
      
      if (!categoryValue && item?.reason) {
        const reasonMatch = item.reason.match(/'([^']+)'/);
        if (reasonMatch && reasonMatch[1]) {
          categoryValue = reasonMatch[1];
        }
      }
      
      let descriptionValue = item?.description || "";
      if (!descriptionValue && item?.reason) {
        const reasonMatch = item.reason.match(/'([^']+)'/);
        if (reasonMatch && reasonMatch[1]) {
          descriptionValue = reasonMatch[1];
        }
      }
      
      return {
        description: descriptionValue,
        category: categoryValue,
        size: item?.size || "",
        quantity: item?.quantity || 0,
        unitPrice: item?.unitPrice || 0,
        brand: item?.brand || "",
      };
    },
    [item]
  );

  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [selectedSKU, setSelectedSKU] = useState<SKUItem | null>(null);

  const brandOptions = [
    { value: "Norpack", label: "NORPACK" },
    { value: "AKG", label: "AKG" },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedSKU(null);
    }
  }, [isOpen, initialFormData]);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleInputChange = useCallback(
    (field: keyof ItemFormData, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSKUSelect = useCallback((skuItem: SKUItem | null) => {
    setSelectedSKU(skuItem);
    if (skuItem) {
      setFormData((prev) => ({
        ...prev,
        description: skuItem.description,
        category: skuItem.category || skuItem.description,
        size: skuItem.size,
        unitPrice: skuItem.display_price,
      }));
    }
  }, []);

  const handleNumberInput = useCallback(
    (field: keyof ItemFormData, value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        handleInputChange(field, numValue);
      } else if (value === "") {
        handleInputChange(field, 0);
      }
    },
    [handleInputChange]
  );

  const calculations = useMemo(() => {
    const baseAmount = formData.quantity * formData.unitPrice;
    const finalAmount = baseAmount;

    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      finalAmount: parseFloat(Math.max(0, finalAmount).toFixed(2)),
    };
  }, [formData]);

  const isFormValid = useMemo(() => {
    const hasValidItemName = formData.category.trim() !== "" || formData.description.trim() !== "";
    const baseValidation = (
      hasValidItemName &&
      formData.quantity > 0 &&
      formData.unitPrice > 0
    );
    
    let isValid = baseValidation;
    if (!selectedSKU) {
      isValid = baseValidation && formData.brand?.trim() !== "";
    }
    
    return isValid;
  }, [formData, selectedSKU]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "");
  };

  const handleSave = useCallback(() => {
    if (!isFormValid) return;

    const itemToSave: QuotationItem = {
      id: item?.id || Date.now().toString(),
      description: formData.category.trim() || formData.description.trim(),
      category: selectedSKU?.category || formData.category.trim() || item?.category,
      brand: selectedSKU?.brand || formData.brand || item?.brand,
      size: formData.size,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      amount: calculations.finalAmount,
      unit: item?.unit || "",
      hsn_code: selectedSKU?.hsn_code || item?.hsn_code,
      material_type: item?.material_type,
      size_specification: item?.size_specification,
      line_no: item?.line_no,
    };

    onSave(itemToSave);
    onClose();
  }, [
    formData,
    item?.id,
    item?.line_no,
    item?.material_type,
    item?.size_specification,
    calculations.finalAmount,
    isFormValid,
    onSave,
    onClose,
  ]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/36 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background-light rounded-xl w-full max-w-lg max-h-[100vh] overflow-hidden shadow-2xl">
        <div className="px-6 pt-5 pb-2 border-b border-gray-200 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-dark">{title}</h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <IconX className="w-5 h-5" />
          </Button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* SKU Selection - Only show when no SKU is selected */}
          {!selectedSKU && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-dark">Select SKU</label>
              <SKUDropdown
                value={selectedSKU}
                onChange={handleSKUSelect}
                placeholder="Search for SKU items..."
                disabled={!!formData.brand}
                className="w-full"
              />
            </div>
          )}

          {!selectedSKU && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-dark">Brand Name</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Dropdown
                    options={brandOptions}
                    selected={formData.brand || ""}
                    onChange={(value) => handleInputChange("brand", value)}
                    label=""
                    className="w-full"
                  />
                </div>
                {formData.brand && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange("brand", "")}
                    className="text-pink-dark hover:text-pink-darkest"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {selectedSKU && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-dark">Selected SKU</label>
              <div className="p-3 bg-background-dark border border-border-dark rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-dark">
                      {selectedSKU.hsn_code ? `${selectedSKU.hsn_code} - ` : ''}{selectedSKU.category || selectedSKU.description}
                    </p>
                    <p className="text-xs text-gray-light">Brand: {selectedSKU.brand}</p>
                  </div>
                  <Button
                    onClick={() => setSelectedSKU(null)}
                    variant="ghost"
                    size="sm"
                    className="text-pink-dark hover:text-pink-darkest"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Item name & description */}
          <TextArea
            label="Item name & description"
            placeholder="Enter item name and description"
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            rows={3}
            size="default"
            disabled={!!selectedSKU}
            variant={!!selectedSKU ? "disable" : "default"}
          />

          {/* Size and Unit price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Size"
              placeholder="Enter size"
              value={formData.size}
              onChange={(e) => handleInputChange("size", e.target.value)}
              size="default"
              variant={!!selectedSKU ? "disable" : "default"}
              disabled={!!selectedSKU}  
            />
            <Input
              label="Unit price"
              placeholder="Enter unit price"
              value={formData.unitPrice}
              onChange={(e) =>
                handleNumberInput("unitPrice", String(e.target.value))
              }
              size="default"
              disabled={!!selectedSKU}
              variant={!!selectedSKU ? "disable" : "default"}
            />
          </div>

          <div>
            <NumberInput
              label="Required quantity"
              value={formData.quantity}
              onChange={(val) => handleNumberInput("quantity", val.toString())}
              min={1}
              size="default"
              placeholder="Enter required quantity"
            />
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-dark">
              Amount:
            </label>
            <div className="bg-background-dark text-gray-light rounded-md px-4 py-3 text-sm w-full sm:w-56">
              {formData.quantity > 0 && formData.unitPrice > 0
                ? formatCurrency(calculations.finalAmount)
                : "--"}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5">
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconPlus size={16}/> Add item
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
