import React, { useCallback, useState, useRef } from "react";
import {
  IconSearch,
  IconEdit,
  IconCheck,
  IconX,
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/DropDown";
import { Loading } from "../../components/ui/Loading";
import { ErrorModal } from "../../components/ui/ErrorModal";
import {
  useBulkUpdateRawMaterials,
  useCreateRawMaterials,
  useDeleteRawMaterials,
  useRawMaterialsList,
} from "../../hooks";
import type {
  RawMaterialItem,
  RawMaterialBulkUpdateRequest,
} from "../../types/common";
import { useDebounce } from "../../hooks/useDebounce";
import { usePermissions } from "../../hooks/usePermissions";

const formatDateForAPI = (dateString: string): string => {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const dmy = dateString.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return `${yyyy}-${mm}-${dd}`;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toISOString().split("T")[0];
  } catch {
    return dateString;
  }
};

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const dateMatch = dateString.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    return dateMatch[0];
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
  } catch {
    return dateString;
  }
};

interface EditableCellProps {
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  type?: "text" | "number" | "date";
  placeholder?: string;
}

const EditableCell = React.memo<EditableCellProps>(
  ({
    value,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    type = "text",
    placeholder = "-",
  }) => {
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setEditValue(value);
    }, [value]);

    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleSave = useCallback(() => {
      onSave(editValue);
    }, [editValue, onSave]);

    const handleCancel = useCallback(() => {
      setEditValue(value);
      onCancel();
    }, [value, onCancel]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSave();
        } else if (e.key === "Escape") {
          handleCancel();
        }
      },
      [handleSave, handleCancel]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
      },
      []
    );

    if (isEditing) {
      return (
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full h-10 pr-16 text-sm border-gray-300 focus:border-green-light focus:ring-green-default"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={handleSave}
              className="p-1.5 text-green-default hover:bg-green-50 rounded-md transition-colors cursor-pointer"
              title="Save"
            >
              <IconCheck size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-pink-dark hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Cancel"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>
      );
    }

    const getDisplayValue = () => {
      if (!value) return placeholder;

      if (type === "date") {
        return formatDateForDisplay(value);
      }

      return value;
    };

    return (
      <div
        className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
        onClick={onEdit}
      >
        <span className="text-sm text-gray-dark truncate font-medium">
          {getDisplayValue()}
        </span>
        <IconEdit
          size={14}
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }
);

interface TableRowProps {
  item: RawMaterialItem;
  headers: Array<{
    key: keyof RawMaterialItem;
    label: string;
    width?: string;
    editable?: boolean;
  }>;
  pendingChanges: Map<number, Partial<RawMaterialItem>>;
  editingCell: { itemId: number; field: keyof RawMaterialItem } | null;
  onCellEdit: (itemId: number, field: keyof RawMaterialItem) => void;
  onCellSave: (
    itemId: number,
    field: keyof RawMaterialItem,
    value: string
  ) => void;
  onCellCancel: () => void;
  selectedItems: Set<number>;
  onSelectItem: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
}

const TableRow = React.memo<TableRowProps>(
  ({
    item,
    headers,
    pendingChanges,
    editingCell,
    onCellEdit,
    onCellSave,
    onCellCancel,
    selectedItems,
    onSelectItem,
    onDeleteItem,
  }) => {
    const pendingChangesForItem = pendingChanges.get(item.id) || {};

    const hasPendingChanges = pendingChanges.has(item.id);

    return (
      <tr
        className={`hover:bg-gray-50 ${
          hasPendingChanges ? "bg-yellow-50" : ""
        }`}
      >
        {/* Checkbox column */}
        <td className="px-4 py-4" style={{ width: "60px", minWidth: "60px" }}>
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => onSelectItem(item.id)}
            className="h-4 w-4 border-gray-300 rounded text-green-default focus:ring-green-dark"
          />
        </td>

        {/* ID column */}
        <td className="px-4 py-4" style={{ width: "80px", minWidth: "80px" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-dark font-medium">
              {item.id}
            </span>
            {hasPendingChanges && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                *
              </span>
            )}
          </div>
        </td>

        {/* Data columns */}
        {headers.map((h) => {
          const pendingValue = pendingChangesForItem[h.key];
          const itemValue = item[h.key];
          const currentValue =
            pendingValue !== undefined ? pendingValue : itemValue;
          const displayValue =
            currentValue !== null && currentValue !== undefined
              ? String(currentValue)
              : "";
          const isEditing =
            editingCell?.itemId === item.id && editingCell?.field === h.key;

          let inputType: "text" | "number" | "date" = "text";
          if (h.key === "date_time") {
            inputType = "date";
          } else if (h.key === "price") {
            inputType = "number";
          }

          return (
            <td
              key={String(h.key)}
              className="px-6 py-4"
              style={{
                width: h.width || "180px",
                minWidth: isEditing ? "180px" : h.width || "180px",
              }}
            >
              <EditableCell
                value={displayValue}
                isEditing={isEditing}
                onEdit={() => onCellEdit(item.id, h.key)}
                onSave={(value) => onCellSave(item.id, h.key, value)}
                onCancel={onCellCancel}
                type={inputType}
                placeholder="-"
              />
            </td>
          );
        })}

        {/* Action column */}
        <td className="px-4 py-4" style={{ width: "120px", minWidth: "120px" }}>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onCellEdit(item.id, "grade")}
              title="Edit"
              className="p-1 sm:p-2"
              variant="ghost"
            >
              <IconPencil size={16} />
            </Button>
            <Button
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this item?")
                ) {
                  onDeleteItem(item.id);
                }
              }}
              title="Delete"
              className="p-1 sm:p-2"
              variant="ghost"
            >
              <IconTrash size={14} className="sm:w-4 sm:h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);

const headers: Array<{
  key: keyof RawMaterialItem;
  label: string;
  width?: string;
  editable?: boolean;
  required?: boolean;
}> = [
  {
    key: "grade",
    label: "Grade(Code)",
    width: "120px",
    editable: true,
    required: true,
  },
  {
    key: "date_time",
    label: "Date & Time",
    width: "140px",
    editable: true,
    required: false,
  },
  {
    key: "price",
    label: "Price(In Rupees)",
    width: "150px",
    editable: true,
    required: true,
  },
];

const RawMaterialsPage: React.FC = () => {
  const { can } = usePermissions();
  const canEditRM = can("raw_materials.edit");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editingCell, setEditingCell] = useState<{
    itemId: number;
    field: keyof RawMaterialItem;
  } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Map<number, Partial<RawMaterialItem>>
  >(new Map());
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>(
    {}
  );
  const [newItems, setNewItems] = useState<Partial<RawMaterialItem>[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const debouncedSearch = useDebounce(search, 300);

  const {
    data: rawMaterialsData,
    isLoading,
    error,
    refetch,
  } = useRawMaterialsList({
    page: currentPage,
    page_size: pageSize,
    search: debouncedSearch || undefined,
  });
  const bulkUpdateMutation = useBulkUpdateRawMaterials();
  const createItemsMutation = useCreateRawMaterials();
  const deleteItemsMutation = useDeleteRawMaterials();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearch(e.target.value);
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      });
    },
    [handleSearch]
  );

  const handleNewItemInputChange = useCallback(
    (field: string, value: string) => {
      setNewItemInputs((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddNewItem = useCallback(() => {
    const hasValue = Object.values(newItemInputs).some(
      (value) => value.trim() !== ""
    );

    if (!hasValue) {
      return;
    }

    const grade = newItemInputs.grade?.trim() || "";
    const price = newItemInputs.price?.trim() || "";

    if (!grade) {
      setErrorModal({
        isOpen: true,
        title: "Missing Required Field",
        message:
          "Grade is required. Please enter a grade code before adding the item.",
      });
      return;
    }

    if (!price) {
      setErrorModal({
        isOpen: true,
        title: "Missing Required Field",
        message:
          "Price is required. Please enter a price before adding the item.",
      });
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      setErrorModal({
        isOpen: true,
        title: "Invalid Price",
        message:
          "Price must be a valid positive number. Please enter a correct price value.",
      });
      return;
    }

    const newItem: Partial<RawMaterialItem> = {
      grade: grade,
      price: priceNumber.toString(),
    };

    if (newItemInputs.date_time?.trim()) {
      newItem.date_time = formatDateForAPI(newItemInputs.date_time.trim());
    }

    setNewItems((prev) => [...prev, newItem]);
    setNewItemInputs({});
  }, [newItemInputs]);

  const handleNewItemKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAddNewItem();
      }
    },
    [handleAddNewItem]
  );

  const handleSaveNewItems = useCallback(async () => {
    if (newItems.length === 0) return;

    try {
      for (const item of newItems) {
        const apiPayload = {
          grade: item.grade!,
          price: parseFloat(item.price!),
          date_time: item.date_time,
        };
        await createItemsMutation.mutateAsync(apiPayload);
      }

      setNewItems([]);
      setNewItemInputs({});
    } catch (error) {
      console.error("Failed to save new items:", error);
    }
  }, [newItems, createItemsMutation]);

  const handleCancelAll = useCallback(() => {
    setPendingChanges(new Map());
    setEditingCell(null);
    setNewItems([]);
    setNewItemInputs({});
  }, []);

  const closeErrorModal = useCallback(() => {
    setErrorModal({
      isOpen: false,
      title: "",
      message: "",
    });
  }, []);

  const handleSelectItem = useCallback((itemId: number) => {
    setSelectedItems((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const items = rawMaterialsData?.results || [];
    if (!items || items.length === 0) return;
    setSelectedItems((prev) => {
      if (prev.size === items.length) {
        return new Set();
      } else {
        return new Set(items.map((item: RawMaterialItem) => item.id));
      }
    });
  }, [rawMaterialsData?.results]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.size === 0) return;

    try {
      await deleteItemsMutation.mutateAsync(Array.from(selectedItems));
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Failed to delete items:", error);
    }
  }, [selectedItems, deleteItemsMutation]);

  const handleDeleteItem = useCallback(
    async (itemId: number) => {
      try {
        await deleteItemsMutation.mutateAsync([itemId]);
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    },
    [deleteItemsMutation]
  );

  const handleCellEdit = useCallback(
    (itemId: number, field: keyof RawMaterialItem) => {
      setEditingCell({ itemId, field });
    },
    []
  );

  const handleCellSave = useCallback(
    (itemId: number, field: keyof RawMaterialItem, value: string) => {
      setPendingChanges((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(itemId) || {};

        let formattedValue = value;
        if (field === "date_time") {
          formattedValue = formatDateForAPI(value);
        }

        newMap.set(itemId, { ...existing, [field]: formattedValue });
        return newMap;
      });
      setEditingCell(null);
    },
    []
  );

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    const bulkUpdates: RawMaterialBulkUpdateRequest[] = [];

    for (const [itemId, changes] of pendingChanges) {
      for (const [field, value] of Object.entries(changes)) {
        let formattedValue = value;
        if (field === "date_time") {
          formattedValue = formatDateForAPI(String(value));
        }

        bulkUpdates.push({
          id: itemId,
          field,
          value: formattedValue as string | number,
        });
      }
    }

    try {
      await bulkUpdateMutation.mutateAsync(bulkUpdates);
      setPendingChanges(new Map());
      setEditingCell(null);
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  }, [pendingChanges, bulkUpdateMutation]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-2 px-3 sm:px-4 lg:px-8">
        <div className="bg-white rounded-lg border border-border-dark p-8 text-center">
          <Loading message="Loading raw materials..." size="md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-2 px-3 sm:px-4 lg:px-8">
        <div className="bg-white rounded-lg border border-border-dark p-8 text-center">
          <p className="text-pink-dark">
            Error loading raw materials. Please try again.
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-8xl mx-auto py-2 px-3 sm:px-4 lg:px-8 space-y-4 sm:space-y-6">
        {/* Main Content */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto p-4 space-y-4 bg-background-light rounded-lg border border-border-dark">
            {/* Search Bar and Actions */}
            <div className="px-1 sm:px-0">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-2 lg:order-2 justify-between w-full">
                  {/* Search Bar - Full width on mobile */}
                  <div className="relative w-full sm:w-64 lg:w-80">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-light" />
                    <Input
                      type="text"
                      variant="search"
                      placeholder="Search all items here"
                      ref={searchInputRef}
                      value={search}
                      onChange={handleSearchInputChange}
                      className="w-full"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {/* Add New Button - Always visible */}
                    <Button
                      onClick={handleAddNewItem}
                      className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4"
                      disabled={!canEditRM}
                    >
                      Add New
                    </Button>

                    {/* Save and Cancel buttons - Only show when there are changes */}
                    {(pendingChanges.size > 0 || newItems.length > 0) && (
                      <div className="flex gap-2 sm:gap-3">
                        <Button
                          onClick={handleCancelAll}
                          variant="outline"
                          className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (pendingChanges.size > 0) {
                              await handleSaveChanges();
                            } else if (newItems.length > 0) {
                              await handleSaveNewItems();
                            }
                          }}
                          disabled={
                            bulkUpdateMutation.isPending ||
                            createItemsMutation.isPending ||
                            !canEditRM
                          }
                          className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4"
                        >
                          Save
                        </Button>
                      </div>
                    )}

                    {selectedItems.size > 0 && (
                      <Button
                        onClick={handleDeleteSelected}
                        variant="outline"
                        size="default"
                        className="text-pink-dark border-pink-dark hover:bg-red-50 w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4"
                        disabled={deleteItemsMutation.isPending || !canEditRM}
                      >
                        <span className="inline">
                          Delete ({selectedItems.size})
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-border-dark overflow-hidden">
              {/* Mobile Card View */}
              <div className="block md:hidden">
                <div className="max-h-[60vh] overflow-auto p-4 sm:p-6 space-y-4 pb-6">
                  {/* Add New Item Card - Mobile */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-dark mb-3">
                      Add New Item
                    </h3>
                    <div className="space-y-3">
                      {headers.map((h) => (
                        <div key={`mobile-new-${String(h.key)}`}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {h.label}
                          </label>
                          <div className="relative">
                            <Input
                              placeholder={`Add ${h.label.toLowerCase()}${
                                h.required ? " (required)" : ""
                              }...`}
                              value={newItemInputs[h.key] || ""}
                              onChange={(e) =>
                                handleNewItemInputChange(
                                  String(h.key),
                                  e.target.value
                                )
                              }
                              onKeyDown={handleNewItemKeyDown}
                              className="text-sm"
                            />
                            {newItemInputs[h.key] &&
                              newItemInputs[h.key].trim() !== "" && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="w-2 h-2 bg-green-default rounded-full"></div>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* New Items Cards - Mobile */}
                  {newItems.map((newItem, index) => (
                    <div
                      key={`mobile-new-${index}`}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-green-dark bg-green-lightest px-2 py-1 rounded-full font-medium">
                          NEW
                        </span>
                      </div>
                      <div className="space-y-2">
                        {headers.map((h) => {
                          const value = newItem[h.key];
                          let displayValue =
                            value !== null && value !== undefined
                              ? String(value)
                              : "";

                          if (h.key === "date_time" && displayValue) {
                            displayValue = formatDateForDisplay(displayValue);
                          }

                          return (
                            <div
                              key={String(h.key)}
                              className="flex justify-between"
                            >
                              <span className="text-xs font-medium text-gray-600">
                                {h.label}:
                              </span>
                              <span className="text-xs text-gray-dark font-medium">
                                {displayValue || "-"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Existing Items Cards - Mobile */}
                  {rawMaterialsData?.results.map((item: RawMaterialItem) => (
                    <div
                      key={`mobile-${item.id}`}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500">
                          ID: {item.id}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 border-gray-300 rounded text-green-default focus:ring-green-dark"
                        />
                      </div>
                      <div className="space-y-2">
                        {headers.map((h) => {
                          const value = item[h.key];
                          let displayValue =
                            value !== null && value !== undefined
                              ? String(value)
                              : "";

                          if (h.key === "date_time" && displayValue) {
                            displayValue = formatDateForDisplay(displayValue);
                          }

                          return (
                            <div
                              key={String(h.key)}
                              className="flex justify-between items-center"
                            >
                              <span className="text-xs font-medium text-gray-600">
                                {h.label}:
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-dark">
                                  {displayValue || "-"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="max-h-[60vh] overflow-auto">
                  <div className="min-w-full">
                    <table className="w-full min-w-max">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-gray-50">
                          {/* Checkbox column */}
                          <th
                            className="text-left px-4 py-4 text-sm font-semibold text-gray-dark border-b border-gray-200"
                            style={{ width: "60px", minWidth: "60px" }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedItems.size ===
                                  (rawMaterialsData?.results?.length || 0) &&
                                (rawMaterialsData?.results?.length || 0) > 0
                              }
                              onChange={handleSelectAll}
                              className="h-4 w-4 border-gray-300 rounded text-green-default focus:ring-green-dark"
                            />
                          </th>

                          {/* ID column */}
                          <th
                            className="text-left px-4 py-4 text-sm font-medium text-gray-light border-b border-gray-200"
                            style={{ width: "80px", minWidth: "80px" }}
                          >
                            Sno
                          </th>

                          {/* Other columns */}
                          {headers.map((h) => (
                            <th
                              key={String(h.key)}
                              style={{ width: h.width || "180px" }}
                              className="text-left p-2 text-sm font-medium text-gray-light border-b border-border-dark"
                            >
                              <div className="flex items-center gap-2">
                                {h.label}
                              </div>
                            </th>
                          ))}

                          {/* Action column */}
                          <th
                            className="text-left px-4 py-4 text-sm font-semibold text-gray-dark border-b border-gray-200"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                          </th>
                        </tr>
                        <tr>
                          {/* Empty cell for checkbox column */}
                          <td
                            className="px-4 py-3 border-b border-border-dark"
                            style={{ width: "60px", minWidth: "60px" }}
                          ></td>

                          {/* Empty cell for ID column */}
                          <td
                            className="px-4 py-3 border-b border-border-dark"
                            style={{ width: "80px", minWidth: "80px" }}
                          ></td>

                          {/* Input fields for other columns */}
                          {headers.map((h) => (
                            <td
                              key={`new-item-${String(h.key)}`}
                              className="p-2 border-b border-border-dark"
                            >
                              <div className="relative">
                                <Input
                                  placeholder={`Add ${h.label.toLowerCase()}${
                                    h.required ? " (required)" : ""
                                  }...`}
                                  value={newItemInputs[h.key] || ""}
                                  onChange={(e) =>
                                    handleNewItemInputChange(
                                      String(h.key),
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={handleNewItemKeyDown}
                                />
                                {newItemInputs[h.key] &&
                                  newItemInputs[h.key].trim() !== "" && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <div className="w-2 h-2 bg-green-default rounded-full"></div>
                                    </div>
                                  )}
                              </div>
                            </td>
                          ))}

                          {/* Empty cell for action column */}
                          <td
                            className="px-4 py-3 border-b border-border-dark"
                            style={{ width: "120px", minWidth: "120px" }}
                          ></td>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* New items being added */}
                        {newItems.map((newItem, index) => (
                          <tr
                            key={`new-${index}`}
                            className="bg-green-50 hover:bg-green-lightest"
                          >
                            {/* Empty cell for checkbox column */}
                            <td
                              className="px-4 py-4"
                              style={{ width: "60px", minWidth: "60px" }}
                            ></td>

                            {/* Empty cell for ID column */}
                            <td
                              className="px-4 py-4"
                              style={{ width: "80px", minWidth: "80px" }}
                            >
                              <span className="text-xs text-green-dark bg-green-lightest px-2 py-1 rounded-full font-medium">
                                NEW
                              </span>
                            </td>

                            {/* Data cells */}
                            {headers.map((h) => {
                              const value = newItem[h.key];
                              let displayValue =
                                value !== null && value !== undefined
                                  ? String(value)
                                  : "";

                              // Format date fields for display
                              if (h.key === "date_time" && displayValue) {
                                displayValue =
                                  formatDateForDisplay(displayValue);
                              }

                              return (
                                <td key={String(h.key)} className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-dark truncate font-medium">
                                      {displayValue || "-"}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}

                            {/* Action column for new items */}
                            <td
                              className="px-4 py-4"
                              style={{ width: "120px", minWidth: "120px" }}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setNewItems((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                  className="p-1.5"
                                  title="Remove"
                                  variant="ghost"
                                >
                                  <IconTrash size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* Existing items */}
                        {rawMaterialsData?.results.map(
                          (item: RawMaterialItem) => (
                            <TableRow
                              key={item.id}
                              item={item}
                              headers={headers}
                              pendingChanges={pendingChanges}
                              editingCell={editingCell}
                              onCellEdit={handleCellEdit}
                              onCellSave={handleCellSave}
                              onCellCancel={handleCellCancel}
                              selectedItems={selectedItems}
                              onSelectItem={handleSelectItem}
                              onDeleteItem={handleDeleteItem}
                            />
                          )
                        )}
                      </tbody>
                    </table>
                    {/* Footer spacer */}
                    <div className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {rawMaterialsData && (
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-2 sm:px-2 pb-2 sm:pb-0">
                {/* Info and Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <span className="text-xs sm:text-sm text-gray-dark font-medium">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, rawMaterialsData.count)}{" "}
                    of {rawMaterialsData.count} items
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-dark font-medium whitespace-nowrap">
                      Rows per page:
                    </span>
                    <div className="w-20 sm:w-28">
                      <Dropdown
                        options={[
                          { label: "20", value: 20 },
                          { label: "50", value: 50 },
                          { label: "100", value: 100 },
                        ]}
                        selected={pageSize}
                        onChange={(v) => setPageSize(Number(v))}
                        size="sm"
                        triggerClassName="!py-2 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center lg:justify-end gap-1 sm:gap-2">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="default"
                    className="px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <IconChevronLeft size={16} />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="default"
                    className="px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <IconChevronLeft size={16} />
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-dark font-medium px-2 sm:px-4 whitespace-nowrap">
                    Page {currentPage} of{" "}
                    {Math.max(
                      1,
                      Math.ceil((rawMaterialsData?.count || 0) / pageSize)
                    )}
                  </span>
                  <Button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          Math.max(
                            1,
                            Math.ceil((rawMaterialsData?.count || 0) / pageSize)
                          ),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.max(
                        1,
                        Math.ceil((rawMaterialsData?.count || 0) / pageSize)
                      )
                    }
                    variant="outline"
                    size="default"
                    className="px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <IconChevronRight size={16} />
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentPage(
                        Math.max(
                          1,
                          Math.ceil((rawMaterialsData?.count || 0) / pageSize)
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.max(
                        1,
                        Math.ceil((rawMaterialsData?.count || 0) / pageSize)
                      )
                    }
                    variant="outline"
                    size="default"
                    className="px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};

export default RawMaterialsPage;
