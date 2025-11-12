import React, { useState } from "react";
import {
  IconTrash,
  IconPlus,
  IconSearch,
  IconPlaylistAdd,
  IconAlertCircleFilled,
  IconArrowBack,
} from "@tabler/icons-react";
import type {
  ItemDescriptionTableProps,
  QuotationItem,
  QuotationLineItem,
} from "../../types/common";
import { Button } from "../ui/Button";
import ItemModal from "../modal/ItemModal";
import SelectionModal from "../modal/SelectionModal";
import { Input } from "../ui/Input";
import { NumberInput } from "../ui/NumberInput";
import { Tooltip } from "../ui/Tooltip";

const ItemDescriptionTable: React.FC<
  ItemDescriptionTableProps & {
    matchedItems?: QuotationLineItem[];
  }
> = ({
  items,
  subtotal,
  onItemsChange,
  readOnly = false,
  globalTaxRate = 0,
  globalDiscountRate = 0,
  onGlobalTaxChange,
  onGlobalDiscountChange,
  onSelectionsChange,
  resetSelectionsKey,
}) => {
  const [editingItems, setEditingItems] = useState<QuotationItem[]>(items);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredItems = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let items = editingItems;

    if (term) {
      items = editingItems.filter((i) =>
        [i.description, i.category, i.brand, i.size, i.item_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }

    return items.sort((a, b) => {
      const lineNoA = Number(a.line_no) || 0;
      const lineNoB = Number(b.line_no) || 0;
      return lineNoA - lineNoB;
    });
  }, [editingItems, searchTerm]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedMatchedItem, setSelectedMatchedItem] =
    useState<QuotationLineItem | null>(null);
  const [userSelections, setUserSelections] = useState<Record<string, string>>(
    {}
  );
  const [activeNoMatchLineNo, setActiveNoMatchLineNo] = useState<number | null>(
    null
  );
  const [deletedItems, setDeletedItems] = useState<QuotationItem[]>([]);
  const [editHistory, setEditHistory] = useState<Map<string, QuotationItem[]>>(
    new Map()
  );
  const [addedItems, setAddedItems] = useState<QuotationItem[]>([]);

  React.useEffect(() => {
    if (JSON.stringify(editingItems) !== JSON.stringify(items)) {
      setEditingItems(items);
    }
  }, [items]);

  React.useEffect(() => {
    if (resetSelectionsKey != null) {
      setUserSelections({});
    }
  }, [resetSelectionsKey]);

  const openAddItemModal = () => {
    setEditingItem(null);
    setEditingItemIndex(null);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: QuotationItem, index: number) => {
    setEditingItem(item);
    setEditingItemIndex(index);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setEditingItemIndex(null);
    setActiveNoMatchLineNo(null);
  };

  const calculateItemAmount = (item: QuotationItem) => {
    if (!item.quantity || !item.unitPrice) {
      return 0;
    }
    const baseAmount = item.quantity * item.unitPrice;
    return baseAmount;
  };

  const calculateItemDiscount = (item: QuotationItem) => {
    const baseAmount = calculateItemAmount(item);
    const discountRate = item.discountRate || 0;
    const discountAmount = (baseAmount * discountRate) / 100;
    const finalAmount = baseAmount - discountAmount;

    return {
      discountAmount,
      finalAmount: Math.max(0, finalAmount),
    };
  };

  const handleItemDiscountChange = (itemId: string, discountRate: number) => {
    const updatedItems = editingItems.map((item) => {
      if (item.id === itemId) {
        storeEditHistory(itemId, { ...item });

        const { discountAmount, finalAmount } = calculateItemDiscount({
          ...item,
          discountRate,
        });
        return {
          ...item,
          discountRate,
          discountAmount,
          finalAmount,
        };
      }
      return item;
    });

    setEditingItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const handleItemSave = (item: QuotationItem) => {
    const calculatedAmount = calculateItemAmount(item);
    const discountRate = item.discountRate ?? (editingItemIndex !== null ? editingItems[editingItemIndex]?.discountRate : 0) ?? 0;
    
    const { discountAmount, finalAmount } = calculateItemDiscount({
      ...item,
      amount: calculatedAmount,
      discountRate,
    });
    
    const updatedItem = { 
      ...item, 
      amount: calculatedAmount,
      discountRate,
      discountAmount,
      finalAmount,
    };

    let updatedItems: QuotationItem[];

    if (editingItemIndex !== null) {
      const previousItem = editingItems[editingItemIndex];
      if (previousItem) {
        storeEditHistory(previousItem.id, previousItem);
        
        const preservedFields = {
          line_no: previousItem.line_no,
          match_type: previousItem.match_type,
          options: previousItem.options,
          recommended_option: previousItem.recommended_option,
          reason: previousItem.reason,
          material_type: previousItem.material_type,
          size_specification: previousItem.size_specification,
          unit: previousItem.unit || item.unit || "",
        };
        
        const mergedItem = {
          ...updatedItem,
          ...preservedFields,
          description: item.description ?? previousItem.description,
          category: item.category ?? previousItem.category,
          brand: item.brand ?? previousItem.brand,
          size: item.size ?? previousItem.size,
          hsn_code: item.hsn_code ?? previousItem.hsn_code,
          quantity: item.quantity ?? previousItem.quantity,
          unitPrice: item.unitPrice ?? previousItem.unitPrice,
          amount: calculatedAmount,
          discountRate,
          discountAmount,
          finalAmount,
        };
        
        updatedItems = [...editingItems];
        updatedItems[editingItemIndex] = mergedItem;
      } else {
        updatedItems = [...editingItems];
        updatedItems[editingItemIndex] = updatedItem;
      }
    } else if (activeNoMatchLineNo !== null) {
      const targetIndex = editingItems.findIndex(
        (it) => Number(it.line_no) === Number(activeNoMatchLineNo)
      );
      if (targetIndex >= 0) {
        const preserved = editingItems[targetIndex];
        setAddedItems((prev) => [
          ...prev,
          { ...preserved, _originalNoMatch: true },
        ]);

        const replacement: QuotationItem = {
          ...updatedItem,
          id: preserved.id || String(activeNoMatchLineNo),
          line_no: preserved.line_no ?? activeNoMatchLineNo,
          unit: updatedItem.unit || preserved.unit || "",
          selection_source: "manual",
        };
        updatedItems = [...editingItems];
        updatedItems[targetIndex] = replacement;
        setAddedItems((prev) => [...prev, replacement]);
      } else {
        const newItem: QuotationItem = {
          ...updatedItem,
          selection_source: "manual",
        };
        updatedItems = [...editingItems, newItem];
        setAddedItems((prev) => [...prev, newItem]);
      }
    } else {
      const maxExistingLineNo = editingItems.reduce((max, it) => {
        const n = Number((it as any).line_no) || 0;
        return n > max ? n : max;
      }, 0);
      const nextLineNo = (Number((updatedItem as any).line_no) || 0) > 0
        ? Number((updatedItem as any).line_no)
        : maxExistingLineNo + 1;

      const newItem: QuotationItem = {
        ...updatedItem,
        id: String(updatedItem.id || nextLineNo),
        line_no: nextLineNo,
        selection_source: "manual",
      } as QuotationItem;

      updatedItems = [...editingItems, newItem];
      setAddedItems((prev) => [...prev, newItem]);
    }

    setEditingItems(updatedItems);
    onItemsChange(updatedItems);

    if (activeNoMatchLineNo !== null) {
      const manualPayload = {
        line_no: activeNoMatchLineNo,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        selected_item: {
          description: updatedItem.description,
          category: updatedItem.category,
          brand: updatedItem.brand,
          size: updatedItem.size,
          hsn_code: updatedItem.hsn_code,
          unit_price: updatedItem.unitPrice,
        },
      } as const;

      const newSelections = {
        ...userSelections,
        [String(activeNoMatchLineNo)]: JSON.stringify(manualPayload),
      };
      setUserSelections(newSelections);
      if (onSelectionsChange) {
        onSelectionsChange(newSelections);
      }
      setActiveNoMatchLineNo(null);
    }
  };

  const handleDeleteSelected = () => {
    const getItemKey = (it: QuotationItem) =>
      String((it as any).id ?? (it as any).line_no);
    const itemsToDelete = editingItems.filter((item) =>
      selectedItems.has(getItemKey(item))
    );

    if (itemsToDelete.length > 0) {
      setDeletedItems((prev) => [...prev, ...itemsToDelete]);
    }

    const updatedItems = editingItems.filter(
      (item) => !selectedItems.has(getItemKey(item))
    );
    setEditingItems(updatedItems);
    onItemsChange(updatedItems);
    setSelectedItems(new Set());
  };

  const handleDeleteItem = (itemId: string) => {
    const getItemKey = (it: QuotationItem) =>
      String((it as any).id ?? (it as any).line_no);
    const itemToDelete = editingItems.find(
      (item) => getItemKey(item) === itemId
    );
    if (itemToDelete) {
      setDeletedItems((prev) => [...prev, itemToDelete]);
    }

    const updatedItems = editingItems.filter(
      (item) => getItemKey(item) !== itemId
    );
    setEditingItems(updatedItems);
    onItemsChange(updatedItems);
    const newSelection = new Set(selectedItems);
    newSelection.delete(itemId);
    setSelectedItems(newSelection);
  };

  const handleUndoDelete = () => {
    if (deletedItems.length === 0) return;

    const lastDeletedItem = deletedItems[deletedItems.length - 1];
    const updatedItems = [...editingItems, lastDeletedItem];
    setEditingItems(updatedItems);
    onItemsChange(updatedItems);

    setDeletedItems((prev) => prev.slice(0, -1));
  };

  const storeEditHistory = (itemId: string, previousState: QuotationItem) => {
    setEditHistory((prev) => {
      const newHistory = new Map(prev);
      const history = newHistory.get(itemId) || [];
      newHistory.set(itemId, [...history, previousState]);
      return newHistory;
    });
  };

  const handleUndoEdit = (itemId: string) => {
    const history = editHistory.get(itemId);
    if (!history || history.length === 0) return;

    const previousState = history[history.length - 1];
    const updatedItems = editingItems.map((item) =>
      item.id === itemId ? previousState : item
    );

    const item = editingItems.find((item) => item.id === itemId);
    if (item && addedItems.some((addedItem) => addedItem.id === itemId)) {
      const lineNo = String(item.line_no);
      const newSelections = { ...userSelections };
      delete newSelections[lineNo];
      setUserSelections(newSelections);
      if (onSelectionsChange) {
        onSelectionsChange(newSelections);
      }
    }

    setEditingItems(updatedItems);
    onItemsChange(updatedItems);

    setEditHistory((prev) => {
      const newHistory = new Map(prev);
      const updatedHistory = history.slice(0, -1);
      if (updatedHistory.length === 0) {
        newHistory.delete(itemId);
      } else {
        newHistory.set(itemId, updatedHistory);
      }
      return newHistory;
    });
  };

  const handleSelectItem = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    const getItemKey = (it: QuotationItem) =>
      String((it as any).id ?? (it as any).line_no);
    if (selectedItems?.size === editingItems?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(editingItems.map((item) => getItemKey(item))));
    }
  };

  const canUndoItem = (itemId: string) => {
    return addedItems.some((addedItem) => addedItem.id === itemId);
  };

  const canUndoEdit = (itemId: string) => {
    return editHistory.has(itemId) && editHistory.get(itemId)!.length > 0;
  };

  const handleCombinedUndo = (itemId: string) => {
    if (canUndoEdit(itemId)) {
      handleUndoEdit(itemId);
    } else if (canUndoItem(itemId)) {
      handleUndoItem(itemId);
    }
  };

  const canUndo = (itemId: string) => {
    return canUndoEdit(itemId) || canUndoItem(itemId);
  };

  const handleUndoItem = (itemId: string) => {
    const addedItem = addedItems.find((item) => item.id === itemId);
    if (!addedItem) return;

    const originalSelectionItemIndex = addedItems.findIndex(
      (item) =>
        (item as any)._originalItem && item.line_no === addedItem.line_no
    );

    const originalNoMatchItemIndex = addedItems.findIndex(
      (item) =>
        (item as any)._originalNoMatch && item.line_no === addedItem.line_no
    );

    const lineNo = String(addedItem.line_no);
    const newSelections = { ...userSelections };
    delete newSelections[lineNo];
    setUserSelections(newSelections);
    if (onSelectionsChange) {
      onSelectionsChange(newSelections);
    }

    if (originalSelectionItemIndex !== -1) {
      const originalItem = addedItems[originalSelectionItemIndex];
      const restoredItem = { ...originalItem };
      delete (restoredItem as any)._originalItem;

      const updatedItems = editingItems.map((item) =>
        item.id === itemId ? restoredItem : item
      );
      setEditingItems(updatedItems);
      onItemsChange(updatedItems);

      setAddedItems((prev) =>
        prev.filter(
          (item) => item.id !== itemId && !(item as any)._originalItem
        )
      );
    } else if (originalNoMatchItemIndex !== -1) {
      const originalNoMatchItem = addedItems[originalNoMatchItemIndex];
      const restoredItem = { ...originalNoMatchItem };
      delete (restoredItem as any)._originalNoMatch;

      const updatedItems = editingItems.map((item) =>
        item.id === itemId ? restoredItem : item
      );
      setEditingItems(updatedItems);
      onItemsChange(updatedItems);

      setAddedItems((prev) =>
        prev.filter(
          (item) => item.id !== itemId && !(item as any)._originalNoMatch
        )
      );
    } else {
      const updatedItems = editingItems.filter((item) => item.id !== itemId);
      setEditingItems(updatedItems);
      onItemsChange(updatedItems);

      setAddedItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const getStatusBox = (item: QuotationLineItem) => {
    if (item.match_type === null) {
      return (
        <div className="inline-flex items-center px-2 py-1 gap-1 rounded-sm text-xs font-medium bg-pink-dark text-white w-fit">
          <IconAlertCircleFilled size={14} />
          No match
        </div>
      );
    } else if (item.match_type === false) {
      return (
        <div className="inline-flex items-center px-2 py-1 gap-1 rounded-sm text-xs font-medium bg-yellow-dark text-white w-fit">
          <IconAlertCircleFilled size={14} />
          Selection required
        </div>
      );
    }
    return null;
  };

  const handleMatchedItemClick = (item: QuotationLineItem) => {
    if (item.match_type === false) {
      setSelectedMatchedItem(item);
      setIsSelectionModalOpen(true);
    } else if (item.match_type === null) {
      setActiveNoMatchLineNo(item.line_no);
      setEditingItem({
        id: String(item.line_no),
        description: item.description || "",
        category: item.category || "",
        brand: item.brand || "",
        size: item.size_specification || item.size || "",
        hsn_code: "",
        quantity: Number(item.quantity) || 0,
        unitPrice: 0,
        unit: item.unit || "",
        amount: 0,
        material_type: item.material_type,
        size_specification: item.size_specification,
        reason: item.reason,
      });
      setEditingItemIndex(null);
      setIsItemModalOpen(true);
    }
  };

  const handleAddItemsFromSelection = (
    selectedOptions: Array<{
      option: QuotationLineItem["options"][0];
      quantity: number;
    }>
  ) => {
    const first = selectedOptions[0];
    if (!first) return;

    const { option, quantity } = first;

    const targetLineNo = selectedMatchedItem?.line_no;
    const targetIndex =
      targetLineNo != null
        ? editingItems.findIndex(
            (it) => Number(it.line_no) === Number(targetLineNo)
          )
        : -1;

    const updatedEntry = {
      id: String(targetLineNo ?? `${option.option_id}_${Date.now()}`),
      description: option.description,
      category: option.category,
      brand: option.brand,
      size: option.size,
      hsn_code: option.hsn_code,
      quantity: quantity,
      unitPrice:
        option.unit_price_piece || option.unit_price_meter || option.lp || 0,
      unit: selectedMatchedItem?.unit || "",
      amount:
        (option.unit_price_piece || option.unit_price_meter || option.lp || 0) *
        quantity,
      matched: true,
      reason: option.match_reason,
      line_no: targetLineNo ?? undefined,
      recommended_option: null,
      options: [],
      selection_source: "selected",
    } as QuotationItem;

    let nextItems: QuotationItem[];

    if (targetIndex >= 0) {
      const originalItem = editingItems[targetIndex];
      if (originalItem) {
        setAddedItems((prev) => [
          ...prev,
          { ...originalItem, _originalItem: true },
        ]);
      }

      nextItems = [...editingItems];
      nextItems[targetIndex] = updatedEntry;
      setAddedItems((prev) => [...prev, updatedEntry]);
    } else {
      nextItems = [...editingItems, updatedEntry];
      setAddedItems((prev) => [...prev, updatedEntry]);
    }

    setEditingItems(nextItems);
    onItemsChange(nextItems);
  };

  const handleFinalizeSelections = async (
    selections: Record<string, string>
  ) => {
    try {
      const newSelections = { ...userSelections, ...selections };
      setUserSelections(newSelections);

      if (onSelectionsChange) {
        onSelectionsChange(newSelections);
      }
    } catch (error) {
      console.error("Error updating selections:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "");
  };

  const calculateTotals = () => {
    const individualDiscounts = editingItems.reduce((sum, item) => {
      const { discountAmount } = calculateItemDiscount(item);
      return sum + discountAmount;
    }, 0);

    const finalAmounts = editingItems.reduce((sum, item) => {
      const { finalAmount } = calculateItemDiscount(item);
      return sum + finalAmount;
    }, 0);

    const subtotalAmount = subtotal;
    const globalTaxAmount = (subtotalAmount * globalTaxRate) / 100;

    const hasIndividualDiscounts = editingItems.some(
      (item) => (item.discountRate || 0) > 0
    );
    const globalDiscountAmount = hasIndividualDiscounts
      ? 0
      : (subtotalAmount * globalDiscountRate) / 100;

    const total = hasIndividualDiscounts
      ? finalAmounts + globalTaxAmount
      : subtotalAmount + globalTaxAmount - globalDiscountAmount;

    return {
      subtotal: subtotalAmount,
      globalTaxAmount,
      globalDiscountAmount,
      individualDiscounts,
      finalAmounts,
      hasIndividualDiscounts,
      total,
    };
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="bg-background-light rounded-lg border border-border-dark overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {!readOnly && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Input
                    type="text"
                    variant={"search"}
                    placeholder="Search Items"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-light" />
                </div>

                {selectedItems.size > 0 && (
                  <Button
                    onClick={handleDeleteSelected}
                    variant="outline"
                    size="sm"
                    className="text-pink-dark border-pink-darkest hover:bg-red-50"
                  >
                    <IconTrash className="w-4 h-4 mr-1" />
                    Delete ({selectedItems.size})
                  </Button>
                )}

                {deletedItems.length > 0 && (
                  <Button
                    onClick={handleUndoDelete}
                    variant="outline"
                    size="sm"
                    className="text-green-dark border-green-darkest hover:bg-green-50"
                  >
                    <IconArrowBack className="w-4 h-4 mr-1" />
                    Undo Delete ({deletedItems.length})
                  </Button>
                )}
              </div>

              <Button onClick={openAddItemModal} className="w-full sm:w-auto">
                <IconPlaylistAdd className="w-4 h-4 mr-2" />
                Add an Item
              </Button>
            </div>
          )}
        </div>

        {editingItems.length === 0 && !readOnly ? (
          <div className="px-6 pb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-light mb-4">No items added yet</p>
              <Button onClick={openAddItemModal} variant="outline" size="sm">
                <IconPlus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable content area with max height */}
            <div className="max-h-[60vh] sm:max-h-[550px] overflow-y-auto">
              <div className="overflow-x-auto px-6">
                <table className="w-full bg-white border border-border-dark">
                  <thead>
                    <tr>
                      {!readOnly && (
                        <th className="pl-3 pt-3 flex justify-center items-center w-12 ml-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedItems.size === editingItems.length &&
                              editingItems.length > 0
                            }
                            onChange={handleSelectAll}
                            className="h-4 w-4 border-gray-300 rounded"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark min-w-[12rem] sm:min-w-[8rem]">
                        Item description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-20">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-20">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-24">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-24">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-20">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-dark w-24">
                        Final Amount
                      </th>
                      {!readOnly && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-dark w-12"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item, index) => {
                      const isActionable =
                        item.match_type === false || item.match_type === null;
                      const colSpan = readOnly ? 7 : 9;
                      const { discountAmount, finalAmount } =
                        calculateItemDiscount(item);

                      return isActionable ? (
                        <tr
                          key={`matched-${item.line_no}`}
                          className={`bg-white ${
                            readOnly ? "" : "hover:bg-gray-50 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (readOnly) return;
                            handleMatchedItemClick(item as any);
                          }}
                        >
                          <td colSpan={colSpan} className="px-2.5 py-4">
                            <div className="flex items-center justify-between gap-4">
                              {!readOnly && (
                                <div
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-sm text-gray-dark">
                                    {item.line_no}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.has(
                                      String((item as any).id ?? item.line_no)
                                    )}
                                    onChange={() =>
                                      handleSelectItem(
                                        String((item as any).id ?? item.line_no)
                                      )
                                    }
                                    className="h-4 w-4 rounded"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-gray-dark break-words whitespace-pre-wrap max-w-[28rem] sm:max-w-none">
                                  {(() => {
                                    const brand = item.brand || "";
                                    const category = item.category || "";
                                    const description =
                                      item.description ||
                                      item.material_type ||
                                      item.size_specification ||
                                      "";
                                    const match =
                                      item.reason?.match(/'([^']+)'/);

                                    if (brand && category) {
                                      return `${brand} ${category}`;
                                    } else if (brand && description) {
                                      return `${brand} ${description}`;
                                    } else if (description) {
                                      return `${description}`;
                                    } else if (brand) {
                                      return `${brand}`;
                                    } else {
                                      return `${
                                        match ? match[1] : "No description"
                                      }`;
                                    }
                                  })()}
                                </span>
                                <div
                                  className={`flex flex-col sm:gap-4 ${
                                    item.match_type === false
                                      ? "bg-yellow-light"
                                      : "bg-pink-default"
                                  } p-4 rounded-lg w-60`}
                                >
                                  {getStatusBox(item as any)}
                                  {item.match_type === false && (
                                    <p className="text-xs text-yellow-dark">
                                      Multiple items match this description.
                                      Click to choose.
                                    </p>
                                  )}
                                  {item.match_type === null && (
                                    <p className="text-xs text-pink-dark">
                                      Item not found in database. Click to
                                      search or add details manually.
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!readOnly && (
                                <div
                                  className="mx-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    onClick={() =>
                                      handleDeleteItem(
                                        String((item as any).id ?? item.line_no)
                                      )
                                    }
                                    variant="ghost"
                                    size="sm"
                                    className="text-pink-darkest hover:bg-red-50"
                                    title="Delete item"
                                  >
                                    <IconTrash className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={item.id}
                          className={`${readOnly ? "" : "hover:bg-gray-50"}`}
                        >
                          {!readOnly && (
                            <td className="pl-1 pt-4 flex justify-center items-center  gap-2">
                              <span className="text-sm text-gray-dark">
                                {item.line_no}
                              </span>
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="h-4 w-4 rounded"
                              />
                            </td>
                          )}
                          <td
                            className={`px-4 py-3 ${
                              readOnly ? "" : "cursor-pointer"
                            }`}
                            onClick={() => {
                              if (readOnly) return;
                              openEditItemModal(item, index);
                            }}
                          >
                            <div>
                              {item.selection_source && (
                                <Tooltip
                                  content={
                                    item.selection_source === "selected"
                                      ? "Click to re-select an item from the list"
                                      : "Click to update item details"
                                  }
                                  position="bottom"
                                >
                                  <span
                                    className={`inline-block my-1 text-[12px] font-medium px-2 py-0.5 rounded-md ${
                                      item.selection_source === "selected"
                                        ? "bg-yellow-light text-yellow-dark"
                                        : "bg-pink-default text-pink-dark"
                                    }`}
                                  >
                                    {item.selection_source === "selected"
                                      ? "Selected from list"
                                      : "Entered manually"}
                                  </span>
                                </Tooltip>
                              )}
                              <span className="text-sm font-medium text-gray-dark block break-words whitespace-pre-wrap">
                                {(() => {
                                  const brand = item.brand || "";
                                  const category = item.original_description || item.category || "";
                                  const description = item.description || "";

                                  if (brand && category) {
                                    return `${brand} ${category}`;
                                  } else if (brand && description) {
                                    return `${brand} ${description}`;
                                  } else if (description) {
                                    return description;
                                  } else if (brand) {
                                    return brand;
                                  } else {
                                    return "No description";
                                  }
                                })()}{" "}
                              </span>
                              {item.hsn_code && (
                                <span className="text-xs text-gray-light">
                                  {item.hsn_code}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-dark">
                              {item.size || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-dark">
                              {item.quantity.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              {(item.discountRate || 0) > 0 ? (
                                <>
                                  <span className="text-sm text-gray-light line-through">
                                    {formatCurrency(item.unitPrice)}
                                  </span>
                                  <span className="text-sm font-medium text-green-default">
                                    {formatCurrency(
                                      item.unitPrice *
                                        (1 - (item.discountRate || 0) / 100)
                                    )}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-dark">
                                  {formatCurrency(item.unitPrice)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-dark">
                              {formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!readOnly ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <NumberInput
                                    size="sm"
                                    value={item.discountRate || 0}
                                    onChange={(value) =>
                                      handleItemDiscountChange(item.id, value)
                                    }
                                    placeholder="0"
                                    max="100"
                                    decimalPlaces={0}
                                    disabled={globalDiscountRate > 0}
                                  />
                                </div>
                                {(item.discountRate || 0) > 0 && (
                                  <div className="text-xs text-green-default m-1">
                                    -{formatCurrency(discountAmount)} discount
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-dark font-medium">
                                {(item.discountRate || 0).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-medium ${
                                (item.discountRate || 0) > 0
                                  ? "text-green-default"
                                  : "text-gray-dark"
                              }`}
                            >
                              {formatCurrency(finalAmount)}
                            </span>
                          </td>
                          {!readOnly && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {canUndo(item.id) && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCombinedUndo(item.id);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-darkest hover:bg-blue-50"
                                    title="Undo last change"
                                  >
                                    <IconArrowBack className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-pink-darkest hover:bg-red-50"
                                  title="Delete item"
                                >
                                  <IconTrash className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="bg-background-lightest border border-border-dark p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-dark">
                        Subtotal
                      </span>
                      <div className="w-52">
                        <Input
                          type="text"
                          size="default"
                          variant="searchDark"
                          className="text-right font-medium"
                          value={formatCurrency(totals.subtotal)}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-light">
                        {totals.hasIndividualDiscounts
                          ? "Individual Discounts"
                          : "Discount"}
                      </span>
                      <div className="flex items-center gap-2">
                        {!totals.hasIndividualDiscounts && (
                          <div className="relative w-20">
                            <div>
                              <NumberInput
                                size="default"
                                value={globalDiscountRate}
                                onChange={(value) =>
                                  onGlobalDiscountChange?.(value)
                                }
                                placeholder="0"
                                max="100"
                                decimalPlaces={2}
                                disabled={readOnly}
                                variant={readOnly ? "disable" : "default"}
                              />
                              <span className="absolute inset-y-0 right-2 flex items-center text-xs text-gray-light pointer-events-none">
                                %
                              </span>
                            </div>
                          </div>
                        )}
                        <span className="inline-flex items-center p-3 rounded-lg text-xs font-medium bg-background-dark w-30">
                          -
                          {formatCurrency(
                            totals.hasIndividualDiscounts
                              ? totals.individualDiscounts
                              : totals.globalDiscountAmount
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-light">Tax</span>
                      <div className="flex items-center gap-2">
                        <div className="relative w-20">
                          <div>
                            <NumberInput
                              size="default"
                              value={globalTaxRate}
                              onChange={(value) => onGlobalTaxChange?.(value)}
                              placeholder="0"
                              max="100"
                              decimalPlaces={2}
                              disabled={readOnly}
                              variant={readOnly ? "disable" : "default"}
                            />
                            <span className="absolute inset-y-0 right-2 flex items-center text-xs text-gray-light pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center p-3 rounded-lg text-xs font-medium bg-background-dark w-30">
                          +{formatCurrency(totals.globalTaxAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="bg-background-lightest border border-border-dark rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-dark">
                    Total amount
                  </span>
                  <div className="w-52">
                    <Input
                      type="text"
                      size="default"
                      variant="searchDark"
                      className="text-right font-semibold"
                      value={formatCurrency(totals.total)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Item Modal */}
      {!readOnly && (
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={closeItemModal}
          onSave={handleItemSave}
          item={editingItem}
          title={editingItem ? "Edit Item" : "Items"}
        />
      )}

      {/* Selection Modal */}
      {!readOnly && (
        <SelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          item={selectedMatchedItem}
          onAddItems={handleAddItemsFromSelection}
          onFinalizeSelections={handleFinalizeSelections}
          onManualEntry={(lineItem) => {
            setIsSelectionModalOpen(false);
            setActiveNoMatchLineNo(lineItem.line_no);
            setEditingItem({
              id: String(lineItem.line_no),
              description: lineItem.description || "",
              category: lineItem.category || "",
              brand: lineItem.brand || "",
              size: lineItem.size_specification || lineItem.size || "",
              hsn_code: "",
              quantity: Number(lineItem.quantity) || 0,
              unitPrice: 0,
              unit: lineItem.unit || "",
              amount: 0,
            });
            setEditingItemIndex(null);
            setIsItemModalOpen(true);
          }}
        />
      )}
    </>
  );
};

export default ItemDescriptionTable;
