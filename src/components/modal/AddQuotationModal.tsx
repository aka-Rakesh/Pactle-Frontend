import { IconPlus, IconTrash, IconX, IconEdit, IconUpload, IconFile } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState, useCallback, useMemo, useRef } from "react";
import type { AddQuotationModalProps, Quotation, QuotationItem, ManualQuotationPayload } from "../../types/common";
import { Button } from "../ui/Button";
import ItemModal from "./ItemModal";
import { quotationApi } from "../../api";
import { queryKeys } from "../../lib/queryKeys";
import { useAuthStore, useQuotationStore } from "../../stores";
import { usePermissions } from "../../hooks/usePermissions";

const AddQuotationModal: React.FC<AddQuotationModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onSave,
  generateRFQId,
}) => {
  const initialFormData = useMemo(
    () => ({
      rfqId: quotation?.rfqId || quotation?.quote_id || "",
      amount: quotation?.amount || 0,
      subtotal: quotation?.subtotal || 0,
      totalAmountDue: quotation?.totalAmountDue || 0,
      status: quotation?.status || "processed",
      items: quotation?.items || [],
    }),
    [quotation, generateRFQId]
  );

  const [formData, setFormData] =
    useState<Partial<Quotation>>(initialFormData);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user and company info
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const canCreate = can("quotations.create");
  const canEdit = can("quotations.edit");
  const { addQuotation, startProcessingNew } = useQuotationStore();
  const queryClient = useQueryClient();
  const hasItems = (formData.items || []).length > 0;
  const hasSelectedFiles = selectedFiles.length > 0;
  const isPdfUploadDisabled = hasItems || (!canCreate && !quotation);
  const isAddItemDisabled = hasSelectedFiles || isProcessing || (!canCreate && !quotation) || (!canEdit && !!quotation);

  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setSelectedFiles([]);
      setIsProcessing(false);
      setProcessingError(null);
      setIsCreating(false);
    }
  }, [isOpen, initialFormData]);

  // Helpers
  const allowedExtensions = useMemo(
    () => [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".xlsx", ".xls"],
    []
  );

  const isAllowedFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    return allowedExtensions.some((ext) => name.endsWith(ext));
  }, [allowedExtensions]);

  // File upload handlers
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canCreate) return;
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const valid = files.filter(isAllowedFile);
    setSelectedFiles((prev) => [...prev, ...valid]);
    setProcessingError(null);
    setFormData(prev => ({
      ...prev,
      items: [],
      amount: 0,
      subtotal: 0,
      totalAmountDue: 0
    }));
    if (event.target) {
      event.target.value = '';
    }
  }, [isAllowedFile, canCreate]);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadBlockClick = useCallback(() => {
    if (isPdfUploadDisabled) return;
    fileInputRef.current?.click();
  }, [isPdfUploadDisabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isPdfUploadDisabled) return;
    setIsDragActive(true);
  }, [isPdfUploadDisabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isPdfUploadDisabled) return;
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    const valid = files.filter(isAllowedFile);
    if (valid.length) {
      setSelectedFiles((prev) => [...prev, ...valid]);
      setProcessingError(null);
      setFormData(prev => ({
        ...prev,
        items: [],
        amount: 0,
        subtotal: 0,
        totalAmountDue: 0
      }));
    }
  }, [isPdfUploadDisabled, isAllowedFile]);

  const handleProcessAndClose = useCallback(async () => {
    if (selectedFiles.length === 0 || !canCreate) return;

    startProcessingNew();
    onClose();

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const requestFormData = new FormData();
      selectedFiles.forEach((file) => requestFormData.append('files', file));
      requestFormData.append('company_slug', user?.company_name?.toLowerCase().replace(/\s+/g, '-') || '');
      await quotationApi.processRFQ(requestFormData);
    } catch (error) {
      console.error('Failed to trigger RFQ processing:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, user?.company_name, startProcessingNew, onClose, canCreate]);

  // Calculate totals whenever items change
  React.useEffect(() => {
    if ((formData.items || []).length === 0) {
      setFormData((prev) => ({ 
        ...prev, 
        subtotal: 0,
        amount: 0,
        totalAmountDue: 0
      }));
      return;
    }

    // Calculate subtotal (base amounts only, without individual item taxes/discounts)
    const subtotal = (formData.items || []).reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );

    setFormData((prev) => ({ 
      ...prev, 
      subtotal,
      amount: subtotal,
      totalAmountDue: subtotal
    }));
  }, [formData.items]);

  const openAddItemModal = useCallback(() => {
    setSelectedFiles([]);
    setProcessingError(null);
    setEditingItem(null);
    setEditingItemIndex(null);
    setIsItemModalOpen(true);
  }, []);

  const openEditItemModal = useCallback(
    (item: QuotationItem, index: number) => {
      setSelectedFiles([]);
      setProcessingError(null);
      setEditingItem(item);
      setEditingItemIndex(index);
      setIsItemModalOpen(true);
    },
    []
  );

  const closeItemModal = useCallback(() => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setEditingItemIndex(null);
  }, []);

  const handleItemSave = useCallback(
    (item: QuotationItem) => {
      setFormData((prev) => {
        if (editingItemIndex !== null) {
          const updatedItems = [...(prev.items || [])];
          updatedItems[editingItemIndex] = {
            ...item,
            // Ensure all numeric fields are properly set
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
          };
          return { ...prev, items: updatedItems };
        } else {
          const newItem = {
            ...item,
            // Ensure all numeric fields are properly set
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            amount: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
          };
          return { ...prev, items: [...(prev.items || []), newItem] };
        }
      });
      closeItemModal();
    },
    [editingItemIndex, closeItemModal]
  );

  const removeItem = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canEdit) {
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      return;
    }

    const quotationToSave: Quotation = {
      ...(formData as Quotation),
      id: quotation?.id || Date.now().toString(),
      lastUpdate: "Just now",
      amount: Number(formData.amount) || 0,
      subtotal: Number(formData.subtotal) || 0,
      totalAmountDue: Number(formData.totalAmountDue) || 0,
    };

    setIsCreating(true);
    try {
      const manualQuotationPayload: ManualQuotationPayload = {
      sku_items: formData.items.map((item) => ({
          id: item.id || null,
          brand: item.brand || '',
          category: item.category || '',
          item_code: item.item_code || '',
          description: item.description || '',
          size: item.size || '',
          hsn_code: Number(item.hsn_code) || 0.0,
          rate_per_piece: Number(item.unitPrice) || 0.0,
          rate_per_meter: Number(item.rate_per_meter) || 0.0,
          display_price: Number(item.display_price) || Number(item.unitPrice) || 0.0,
          display_unit: item.display_unit || 'per piece',
          quantity: Number(item.quantity) || 0,
        })),
        company_slug: user?.company_name?.toLowerCase().replace(/\s+/g, '-') || 'akg',
        attachments: []
      };

      const response = await quotationApi.createQuotation(manualQuotationPayload);
      
      if (response?.quote_id) {
        quotationToSave.quote_id = response.quote_id;
        quotationToSave.rfqId = response.quote_id;
      }
      
      // Optimistically update local quotations store so Dashboard table updates immediately
      try {
        addQuotation(quotationToSave);
      } catch (_) {
        // ignore store errors
      }

      onSave(quotationToSave);
      
      // Invalidate related server caches so totals (and server lists) update promptly
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.quotations.stats() }),
        ]);
      } catch (_) {
        // ignore cache errors
      }
      
      onClose();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  }, [formData, quotation?.id, onSave, onClose, user?.company_name, canEdit]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/36 flex items-start justify-end z-40"
        onClick={handleBackdropClick}
      >
        <div className="flex flex-col bg-background-light w-full max-w-2xl min-h-screen overflow-hidden p-6">
          <div className="flex items-center justify-end">
            <Button onClick={onClose} variant="ghost" size="sm">
              <IconX className="w-5 h-5" />
            </Button>
          </div>

          <div className="border border-border-dark rounded-lg">
            <div className="flex items-center justify-start p-6 border-b border-border-dark">
              <h2 className="text-xl font-semibold text-gray-dark">
                {quotation ? "Edit Quotation" : "Create New Quotation"}
              </h2>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="px-6 py-4 space-y-6">
                {/* File Upload Section - Only show for new quotations */}
                {!quotation && (
                  <div className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                        isPdfUploadDisabled 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                          : isDragActive
                          ? 'border-blue-400 bg-blue-50 cursor-pointer'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleUploadBlockClick}
                    >
                      <div className="text-center">
                        <IconUpload className={`mx-auto h-12 w-12 ${
                          isPdfUploadDisabled ? 'text-gray-300' : 'text-gray-400'
                        }`} />
                        <div className="mt-4">
                          <span className={`mt-2 block text-sm font-medium ${
                            isPdfUploadDisabled ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            Upload RFQ Documents (drag & drop or click)
                          </span>
                          <span className={`mt-1 block text-xs ${
                            isPdfUploadDisabled ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Supports PDF, DOC, DOCX, PNG, JPG, JPEG, XLS, XLSX. Max 10MB each
                          </span>
                          {isPdfUploadDisabled && (
                            <span className="mt-1 block text-xs text-orange-600">
                              {canCreate ? 'Disabled: Not permitted for Raw Material role' : 'Disabled: Items have been added manually'}
                            </span>
                          )}
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept={allowedExtensions.join(',')}
                        onChange={handleFileSelect}
                        disabled={isPdfUploadDisabled}
                      />
                      
                      {hasSelectedFiles && (
                        <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                          {selectedFiles.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-300">
                              <div className="flex items-center space-x-2">
                                <IconFile className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile(idx);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-light hover:text-gray-dark"
                                  disabled={isProcessing}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProcessAndClose();
                              }}
                              disabled={isProcessing || !hasSelectedFiles}
                              size="sm"
                            >
                              {isProcessing ? "Processing..." : "Process"}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {processingError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
                          <p className="text-sm text-red-600">{processingError}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!formData.items || formData.items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-light mb-4">No items added yet</p>
                      <Button
                        onClick={openAddItemModal}
                        variant="outline"
                        size="sm"
                        disabled={isAddItemDisabled}
                      >
                        <IconPlus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                      {isAddItemDisabled && (
                        <p className="mt-2 text-xs text-orange-600">
                          Disabled: RFQ document selected/processing
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-12">
                                  #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-52">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-20">
                                  Qty
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-24">
                                  Unit Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-20">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-light uppercase tracking-wider w-24">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(formData.items || []).map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-light">
                                    {String(index + 1).padStart(2, "0")}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-dark">
                                    <div
                                      className="max-w-xs truncate"
                                      title={item.category}
                                    >
                                      {item.category}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-dark">
                                    {item.quantity || 0}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-dark">
                                    ₹{(item.unitPrice || 0).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-dark">
                                    ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        onClick={() =>
                                          openEditItemModal(item, index)
                                        }
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-light hover:text-gray-dark hover:bg-blue-50"
                                        disabled={isAddItemDisabled}
                                      >
                                        <IconEdit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        onClick={() => removeItem(index)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-pink-darkest hover:text-pink-dark hover:bg-red-50"
                                        disabled={isAddItemDisabled}
                                      >
                                        <IconTrash className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-light">Subtotal:</span>
                          <span className="font-medium">₹{(formData.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total Amount:</span>
                          <span>₹{(formData.totalAmountDue || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                    <Button 
                      onClick={openAddItemModal} 
                      size="sm"
                      disabled={isAddItemDisabled}
                    >
                      <IconPlus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                    {isAddItemDisabled && (
                      <p className="text-xs text-orange-600">
                        Disabled: RFQ document is being processed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-border-dark">
              <Button
                onClick={handleSave}
                className="order-1 sm:order-2"
                disabled={!formData.items || formData.items.length === 0 || isCreating || !canEdit}
                title={!canEdit ? "You don't have permission to edit quotations" : undefined}
              >
                {isCreating ? 'Saving...' : (quotation ? "Update Quotation" : "Save Quotation")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={closeItemModal}
        onSave={handleItemSave}
        item={editingItem}
        title={editingItem ? "Edit Item" : "Add Item"}
      />
    </>
  );
};

export default AddQuotationModal;