import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { IconChevronLeft } from "@tabler/icons-react";
import ItemDescriptionTable from "../../components/quotation/QuoteTable";
import { OriginalRFQ } from "../../components/quotation/OriginalRFQ";
import type {
  Quotation,
  QuotationItem,
  RFQEmail,
  QuotationDetailsResponse,
  QuotationStatus,
} from "../../types/common";
import { useQuotationStore } from "../../stores";
import { useQuotationDetails, useFinalizeQuotation, useUpdateQuotation } from "../../hooks";
import { queryKeys } from "../../lib/queryKeys";
import { Input } from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import { Button } from "../../components/ui/Button";
import { Tooltip } from "../../components/ui/Tooltip";
import { Loading } from "../../components/ui/Loading";
import { TextArea } from "../../components/ui/TextArea";
import { usePermissions } from "../../hooks/usePermissions";

const QuotationDetailsPage: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();
  const {
    addQuotation,
    getQuotationByRfqId,
    getRFQEmailData,
    updateQuotation: updateQuotationInStore,
  } = useQuotationStore();
  const queryClient = useQueryClient();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [rfqEmail, setRFQEmail] = useState<RFQEmail | null>(null);
  const [apiData, setApiData] = useState<QuotationDetailsResponse | null>(null);
  const [isLoadingRFQ, setIsLoadingRFQ] = useState(false);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [userSelections, setUserSelections] = useState<Record<string, string>>(
    {}
  );
  const [selectionsResetKey, setSelectionsResetKey] = useState(0);
  const finalizeMutation = useFinalizeQuotation();
  const updateQuotationMutation = useUpdateQuotation();

  const [formData, setFormData] = useState({
    reference_number: "",
    date: "",
    sender_email: "",
    project_name: "",
    project_location: "",
    project_company: "",
    customer_info: {
      customer_email: "",
      customer_name: "",
      customer_phone: "",
      customer_address: "",
    },
  });
  const { can } = usePermissions();
  const canEdit = can("quotations.edit");

  const {
    data: apiDetails,
    error: apiError,
    isLoading: apiLoading,
  } = useQuotationDetails(rfqId);

  useEffect(() => {
    const loadData = async () => {
      if (rfqId) {
        try {
          setIsLoadingRFQ(true);
          setIsLoadingQuotation(true);

          if (apiDetails) {
            setApiData(apiDetails);

            const allLineItems: any[] = [];
            try {
              Object.values(apiDetails.brands || {}).forEach((brand: any) => {
                if (
                  brand &&
                  brand.line_items &&
                  Array.isArray(brand.line_items)
                ) {
                  allLineItems.push(...brand.line_items);
                }
              });
            } catch (error) {
              console.error("Error processing line items:", error);
            }

            const globalTaxRate =
              apiDetails.overall_totals?.subtotal &&
              apiDetails.overall_totals.subtotal > 0
                ? (apiDetails.overall_totals.tax_amount /
                    apiDetails.overall_totals.subtotal) *
                  100
                : 0;
            const globalDiscountRate =
              apiDetails.overall_totals?.discount_rate;

            // Convert API response to local quotation format
            let convertedQuotation: Quotation;
            try {
              const formattedDate = apiDetails.created_at
                ? new Date(apiDetails.created_at).toISOString().split("T")[0]
                : "";
              convertedQuotation = {
                id: apiDetails.quote_id || "",
                quote_id: apiDetails.quote_id || "",
                reference_number: apiDetails.reference_number || "",
                rfqId: apiDetails.quote_id || "",
                date: formattedDate,
                customer_info: {
                  customer_name: apiDetails?.customer_info?.customer_name || "",
                  customer_email: apiDetails?.customer_info?.customer_email || "",
                  customer_phone: apiDetails?.customer_info?.customer_phone || "",
                  customer_address: apiDetails?.customer_info?.customer_address || "",
                },
                amount: apiDetails.overall_totals?.total_amount || 0,
                lastUpdate: new Date().toISOString(),
                status:
                  (apiDetails?.status?.toLowerCase() as QuotationStatus) ||
                  "",
                globalTaxRate: globalTaxRate,
                globalDiscountRate: globalDiscountRate,
                items: allLineItems.map((item: any) => {
                  try {
                    const selectedOption =
                      item.options && item.options.length > 0
                        ? item.options[item.recommended_option || 0]
                        : null;

                    let resolvedUnitPrice = 0;
                    if (selectedOption && (selectedOption as any).unit_price_meter != null) {
                      resolvedUnitPrice = Number((selectedOption as any).unit_price_meter);
                    } else if (selectedOption && (selectedOption as any).unit_price_piece != null) {
                      resolvedUnitPrice = Number((selectedOption as any).unit_price_piece);
                    } else if (selectedOption && (selectedOption as any).lp != null) {
                      resolvedUnitPrice = Number((selectedOption as any).lp);
                    } else if ((item as any).unit_price != null) {
                      resolvedUnitPrice = Number((item as any).unit_price);
                    }

                    const baseAmount = Number(item.quantity || 0) * resolvedUnitPrice;
                    const discountRate = Number(item.discount_percentage || 0);
                    const discountAmount = (baseAmount * discountRate) / 100;
                    const finalAmount = baseAmount - discountAmount;

                    return {
                      id: String(item.line_no ?? Math.random()),
                      description: selectedOption?.category || item.description || "",
                      category: selectedOption?.category || item.category || "",
                      brand: selectedOption?.brand || item.brand || "",
                      size:
                        item.size_specification || selectedOption?.size || "",
                      material_type: item.material_type || "",
                      size_specification: item.size_specification || "",
                      hsn_code: selectedOption?.hsn_code || "",
                      quantity: Number(item.quantity) || 0,
                      unitPrice: resolvedUnitPrice,
                      unit: item.unit || "",
                      amount: baseAmount,
                      discountRate: discountRate,
                      discountAmount: discountAmount,
                      finalAmount: Math.max(0, finalAmount),
                      match_type: item.match_type,
                      reason: item.reasoning || "",
                      line_no: item.line_no,
                      options: item.options || [],
                      recommended_option: item.recommended_option,
                      original_description: item.description || "",
                    };
                  } catch (error) {
                    return {
                      id: String(item.line_no ?? Math.random()),
                      description: item.description || "Error processing item",
                      category: "",
                      brand: "",
                      size: "",
                      hsn_code: "",
                      quantity: 0,
                      unitPrice: 0,
                      unit: "",
                      amount: 0,
                      discountRate: 0,
                      discountAmount: 0,
                      finalAmount: 0,
                      match_type: false,
                      reason: "Error processing item",
                      line_no: item.line_no,
                      options: [],
                      recommended_option: null,
                      original_description: item.description || "",
                    };
                  }
                }),
                subtotal: apiDetails.overall_totals?.subtotal || 0,
                totalAmountDue: apiDetails.overall_totals?.total_amount || 0,
              };
            } catch (error) {
              console.error("Error converting quotation:", error);
              throw error;
            }

            setQuotation(convertedQuotation);
            // Seed local store so Preview can reflect unsaved edits
            const existing = getQuotationByRfqId(rfqId);
            if (!existing) {
              addQuotation(convertedQuotation);
            } 
            const apiProjectInfo = ((apiDetails as any)?.project_info) || {} as any;
            setFormData({
              reference_number: String(apiDetails?.reference_number ?? ""),
              date: String(convertedQuotation?.date ?? ""),
              sender_email: String(apiDetails?.customer_info?.customer_email ?? ""),
              project_name: String((apiProjectInfo as any)?.project_name ?? ""),
              project_location: String((apiProjectInfo as any)?.location ?? ""),
              project_company: String((apiDetails as any)?.company_name ?? (apiProjectInfo as any)?.company_name ?? ""),
              customer_info: {
                customer_email: String(convertedQuotation?.customer_info?.customer_email ?? ""),
                customer_name: String(convertedQuotation?.customer_info?.customer_name ?? ""),
                customer_phone: String(convertedQuotation?.customer_info?.customer_phone ?? ""),
                customer_address: String(convertedQuotation?.customer_info?.customer_address ?? ""),
              },
            });
          }

          const emailData = await getRFQEmailData(rfqId);
          if (emailData) {
            setRFQEmail(emailData);
          }
        } catch (error) {
          console.error("Error loading quotation data:", error);
        } finally {
          setIsLoadingRFQ(false);
          setIsLoadingQuotation(false);
        }
      }
    };

    loadData();
  }, [rfqId, apiDetails]);

  useEffect(() => {
    if (apiError && !apiLoading) {
      console.error("API failed, redirecting to dashboard:", apiError);
      navigate("/dashboard");
    }
  }, [apiError, apiLoading, navigate]);

  const handleFormChange = (
    field: string,
    value: string | [string, string]
  ) => {
    if (typeof value === "string") {
      if (field.startsWith("customer_info.")) {
        const customerField = field.split(".")[1];
        setFormData((prev) => ({
          ...prev,
          customer_info: {
            ...prev.customer_info,
            [customerField]: value,
          },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
      // Keep quotation and store in sync for live preview on editable fields
      if (quotation) {
        if (field.startsWith("customer_info.")) {
          const customerField = field.split(".")[1];
          const updatedQuotation = {
            ...quotation,
            customer_info: {
              ...quotation.customer_info,
              [customerField]: value,
            },
          } as Quotation;
          setQuotation(updatedQuotation);
        } else if (["date"].includes(field)) {
          const updatedQuotation = {
            ...quotation,
            [field]: value,
          } as Quotation;
          setQuotation(updatedQuotation);
        } else if (field === "reference_number") {
          const updatedQuotation = {
            ...quotation,
            reference_number: value,
          } as Quotation;
          setQuotation(updatedQuotation);
        }
      }
    }
  };

  const handleItemsChange = (items: QuotationItem[]) => {
    if (!quotation) return;

    // Calculate subtotal (base amounts only)
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Calculate global taxes and discounts on subtotal
    const globalTaxAmount = (subtotal * (quotation.globalTaxRate || 0)) / 100;
    const globalDiscountAmount =
      (subtotal * (quotation.globalDiscountRate || 0)) / 100;

    // Calculate final total
    const totalAmountDue = subtotal + globalTaxAmount - globalDiscountAmount;

    const updatedQuotation = {
      ...quotation,
      items,
      subtotal,
      totalAmountDue: Math.max(0, totalAmountDue), // Ensure no negative total
      amount: Math.max(0, totalAmountDue),
    };

    setQuotation(updatedQuotation);
  };

  const handleGlobalTaxChange = (rate: number) => {
    if (!quotation) return;

    const updatedQuotation = {
      ...quotation,
      globalTaxRate: rate,
    };

    // Recalculate totals with new tax rate
    const subtotal = quotation.subtotal || 0;
    const globalTaxAmount = (subtotal * rate) / 100;
    const globalDiscountAmount =
      (subtotal * (quotation.globalDiscountRate || 0)) / 100;
    const totalAmountDue = subtotal + globalTaxAmount - globalDiscountAmount;

    updatedQuotation.totalAmountDue = Math.max(0, totalAmountDue);
    updatedQuotation.amount = Math.max(0, totalAmountDue);

    setQuotation(updatedQuotation);
  };

  const handleGlobalDiscountChange = (rate: number) => {
    if (!quotation) return;

    const updatedQuotation = {
      ...quotation,
      globalDiscountRate: rate,
    };

    // Recalculate totals with new discount rate
    const subtotal = quotation.subtotal || 0;
    const globalTaxAmount = (subtotal * (quotation.globalTaxRate || 0)) / 100;
    const globalDiscountAmount = (subtotal * rate) / 100;
    const totalAmountDue = subtotal + globalTaxAmount - globalDiscountAmount;

    updatedQuotation.totalAmountDue = Math.max(0, totalAmountDue);
    updatedQuotation.amount = Math.max(0, totalAmountDue);

    setQuotation(updatedQuotation);
  };

  const handleSelectionsChange = (selections: Record<string, string>) => {
    setUserSelections(selections);
  };

  const handleSaveQuotation = async (): Promise<boolean> => {
    if (!quotation || !apiDetails?.quote_id) {
      return false;
    }

    try {
      const discountRate = Number(quotation.globalDiscountRate || 0);
      const taxRate = Number(quotation.globalTaxRate || 0);
      
      const individualDiscounts = (quotation.items || []).reduce((sum, item) => {
        const itemDiscountRate = item.discountRate || 0;
        const itemDiscountAmount = (item.amount * itemDiscountRate) / 100;
        return sum + itemDiscountAmount;
      }, 0);
      
      const finalAmounts = (quotation.items || []).reduce((sum, item) => {
        const itemDiscountRate = item.discountRate || 0;
        const itemDiscountAmount = (item.amount * itemDiscountRate) / 100;
        const itemFinalAmount = item.amount - itemDiscountAmount;
        return sum + Math.max(0, itemFinalAmount);
      }, 0);
      
      const hasIndividualDiscounts = (quotation.items || []).some(item => (item.discountRate || 0) > 0);
      const effectiveDiscountRate = hasIndividualDiscounts ? 0 : discountRate;
      const effectiveDiscountAmount = hasIndividualDiscounts ? individualDiscounts : (quotation.subtotal || 0) * (discountRate / 100);
      const effectiveSubtotal = hasIndividualDiscounts ? finalAmounts : (quotation.subtotal || 0);
      const effectiveTotal = effectiveSubtotal + ((quotation.subtotal || 0) * (taxRate / 100)) - effectiveDiscountAmount;

      const updates: any = {
        reference_number: formData.reference_number || quotation?.reference_number,
        total_amount: effectiveTotal,
        customer_info: {
          customer_email: formData.customer_info.customer_email || apiDetails?.customer_info?.customer_email || "",
          customer_name: formData.customer_info.customer_name || apiDetails?.customer_info?.customer_name || "",
          customer_phone: formData.customer_info.customer_phone || apiDetails?.customer_info?.customer_phone || "",
          customer_address: formData.customer_info.customer_address || apiDetails?.customer_info?.customer_address || "",
        },
        project_info: {
          project_name: formData.project_name,
          location: formData.project_location,
          company_name: formData.project_company,
        },
        sender_email: formData.sender_email,
        pricing_totals: {
          subtotal: quotation.subtotal || 0,
          tax_rate: taxRate,
          tax_amount: (quotation.subtotal || 0) * (taxRate / 100),
          total_amount: effectiveTotal,
          currency: "INR",
          discount_rate: effectiveDiscountRate,
          discount_amount: effectiveDiscountAmount,
          subtotal_after_discount: effectiveSubtotal,
        },
        processed_line_items: (quotation.items || []).map((i) => {
            const originalUnitPrice = Number(i.unitPrice) || 0;
            const baseAmount = (Number(i.quantity) || 0) * originalUnitPrice;
            return {
            line_no: i.line_no,
            description: i.description,
            material_type: i.material_type || "",
            size_specification: i.size,
            quantity: Number(i.quantity) || 0,
            unit: i.unit,
            notes: i.reason || "",
            unit_price: originalUnitPrice,
            total_price: Number(i.finalAmount) || 0,
            discount_percentage: i.discountRate,
            original_description: i.original_description || i.description,
            matched: i.match_type === true,
            hsn_code: i.hsn_code,
            matched_description: i.description,
            brand: i.brand,
            category: i.category,
            amount: Number(isNaN(baseAmount) ? 0 : baseAmount),
            match_score: i.match_type === true ? 1.0 : i.match_type === false ? 0.5 : 0.0,
            reason: i.reason || "",
            match_type: i.match_type,
            options: i.options || [],
            recommended_option: i.recommended_option,
            size: i.size,
            };
        }),
      };

      await updateQuotationMutation.mutateAsync({
        quoteId: apiDetails.quote_id,
        data: { updates },
      });

      updateQuotationInStore(apiDetails.quote_id, {
        reference_number: updates.reference_number,
        customer_info: updates.customer_info,
      } as any);

      queryClient.setQueryData(queryKeys.quotations.detail(apiDetails.quote_id), (old: any) => ({
        ...(old || {}),
        customer_info: updates.customer_info,
        reference_number: updates.reference_number,
      }));

      return true;
    } catch (error) {
      console.error("Error saving quotation:", error);
      return false;
    }
  };

  const handleFinalizeSelections = async (
    selections: Record<string, string>
  ) => {
    if (!apiData?.quote_id || !quotation) {
      return false;
    }

    try {
      const hasNoMatchItems = (quotation.items || []).some(
        (it) => it && (it as any).match_type === null
      );
      if (hasNoMatchItems) {
        return false;
      }

      // First, save all changes (including discounts) via update API
      const saveSuccess = await handleSaveQuotation();
      if (!saveSuccess) {
        console.error("Failed to save quotation before finalizing");
        return false;
      }

      // Then, finalize selections via finalize API
      await finalizeMutation.mutateAsync({
        quotationId: apiData.quote_id,
        selections,
      });

      return true;
    } catch (error) {
      console.error("Error finalizing quotation:", error);
      return false;
    }
  };

  // Preview button handler: only saves changes (update API), does NOT call finalize
  const handlePreviewNavigate = async () => {
    try {
      if (!quotation || !apiDetails?.quote_id) {
        navigate(`/dashboard/quotations/${rfqId}/preview`);
        return;
      }

      const hasNoMatchItems = (quotation.items || []).some(
        (it) => it && (it as any).match_type === null
      );
      const hasFalseMatchItems = (quotation.items || []).some(
        (it) => it && (it as any).match_type === false
      );
      
      if (hasNoMatchItems) {
        return;
      }

      // Only save changes (update API) - do NOT call finalize
      const saveSuccess = await handleSaveQuotation();
      if (!saveSuccess) {
        console.error("Failed to save quotation before preview");
        return;
      }

      // Navigate to preview only if there are no selection-required items
      const shouldNavigateAfterUpdate = !hasFalseMatchItems;
      if (shouldNavigateAfterUpdate) {
        navigate(`/dashboard/quotations/${rfqId}/preview`);
      }
    } catch (err) {
      console.error("Failed to update quotation before preview", err);
    }
  };

  // const handleSaveAsDraft = async () => {
  //   if (!quotation) return;

  //   setIsSaving(true);
  //   try {
  //     const updatedQuotation = {
  //       ...quotation,
  //       ...formData,
  //       email: `${formData.sendToEmail}${
  //         formData.ccEmails ? ", " + formData.ccEmails : ""
  //       }`,
  //       status: "draft" as QuotationStatus,
  //     };
  //     updateQuotation(quotation.id, updatedQuotation);
  //   } catch (error) {
  //     console.error("Error saving quotation:", error);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  if (apiLoading || isLoadingQuotation) {
    return (
      <Loading
        message="Loading quotation details..."
        subMessage="Please wait while we fetch the quotation data from the server."
      />
    );
  }

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-dark">
            Failed to Load Quotation
          </h2>
          <p className="text-gray-light mt-2">
            Unable to load quotation data. Redirecting to dashboard...
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-default text-white rounded-md hover:bg-green-darkest"
        >
          <IconChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }
  if (!quotation || !apiDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-dark">
            Quotation Not Found
          </h2>
          <p className="text-gray-light mt-2">
            The quotation with RFQ ID "{rfqId}" could not be found.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-default text-white rounded-md hover:bg-green-darkest"
        >
          <IconChevronLeft className="w-4 h-4" />
          Back to Quotations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 py-6 px-8">
      <div className="xl:col-span-2 space-y-6">
        <div className=" space-y-6">
          <h3 className="text-lg font-medium text-gray-dark flex items-center gap-2">
            Quote details
            {apiDetails?.status && (
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  apiDetails.status.toLowerCase() === "approved"
                    ? "bg-green-lightest text-green-dark"
                    : apiDetails.status.toLowerCase() === "processed"
                    ? "bg-blue-100 text-blue-darkest"
                    : apiDetails.status.toLowerCase() === "sent"
                    ? "bg-yellow-light text-yellow-darkest"
                    : "bg-gray-100 text-gray-dark"
                }`}
              >
                {apiDetails.status.toLowerCase() === "approved"
                  ? "Approved"
                  : apiDetails.status.toLowerCase() === "processed"
                  ? "Processed"
                  : apiDetails.status}
              </span>
            )}
          </h3>
          <div className="px-6 py-5 bg-background-light border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Input
                  type="text"
                  size="default"
                  label="Reference ID"
                  value={formData.reference_number}
                  onChange={(e) =>
                    handleFormChange("reference_number", e.target.value)
                  }
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : undefined}
                  placeholder="Reference ID"
                />
              </div>

              <div className="relative">
                <Input
                  type="text"
                  variant="disable"
                  size="default"
                  label="Created At"
                  value={formData.date}
                  disabled
                  placeholder="Reference id"
                />
              </div>

              <div className="relative">
                <Input
                  type="email"
                  size="default"
                  label="Sender Email"
                  value={formData.sender_email || formData.customer_info.customer_email}
                  onChange={(e) => handleFormChange("sender_email", e.target.value)}
                  placeholder="sender@example.com"
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : "default"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 bg-background-light border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  size="default"
                  label="Company Name :"
                  value={formData.project_name || formData.project_company}
                  onChange={(e) => handleFormChange("project_name", e.target.value)}
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : undefined}
                  placeholder="Company Name"
                />
                <TextArea
                  size="default"
                  label="Address :"
                  value={formData.customer_info.customer_address || formData.project_location}
                  onChange={(e) => handleFormChange("customer_info.customer_address", e.target.value)}
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : undefined}
                  placeholder="Customer Address"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  size="default"
                  label="Full Name :"
                  value={formData.customer_info.customer_name}
                  onChange={(e) =>
                    handleFormChange("customer_info.customer_name", e.target.value)
                  }
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : "default"}
                  placeholder="Customer Name"
                />
                <PhoneInput
                  label="Contact Number :"
                  placeholder="Customer Number"
                  value={formData.customer_info.customer_phone}
                  maxDigits={10}
                  onChange={(val) => handleFormChange("customer_info.customer_phone", val)}
                  disabled={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
                  variant={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit ? "disable" : "default"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
          <div className="xl:col-span-5 space-y-4">
            <h3 className="text-lg font-medium text-gray-dark">
              Matched Items
            </h3>
            <ItemDescriptionTable
              items={quotation.items}
              subtotal={quotation.subtotal || 0}
              totalAmountDue={quotation.totalAmountDue || 0}
              onItemsChange={handleItemsChange}
              readOnly={(apiDetails?.status || "").toLowerCase() === "approved" || !canEdit}
              globalTaxRate={quotation.globalTaxRate || 0}
              globalDiscountRate={quotation.globalDiscountRate || 0}
              onGlobalTaxChange={handleGlobalTaxChange}
              onGlobalDiscountChange={handleGlobalDiscountChange}
              onSelectionsChange={handleSelectionsChange}
              resetSelectionsKey={selectionsResetKey}
            />
          </div>

          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-lg font-medium text-gray-dark">Original RFQ</h3>
            <OriginalRFQ
              rfqEmail={rfqEmail}
              apiData={apiData}
              isLoading={isLoadingRFQ}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 p-6 bg-background-light border border-border-dark rounded-lg sticky bottom-0 z-10">
        {(() => {
          const items = quotation.items || [];
          const hasNoMatchItems = items.some((it) => (it as any).match_type === null);
          const hasFalseMatchItems = items.some((it) => (it as any).match_type === false);
          
          const isApproved = (apiDetails?.status || '').toLowerCase() === 'approved';
          const hasSelections = Object.keys(userSelections).length > 0;
          const isFinalizing = finalizeMutation.isPending;
          const isSaving = updateQuotationMutation.isPending;
          const shouldShowFinalize = hasSelections && canEdit && !isApproved;

          // Show both buttons when there are pending selections
          if (shouldShowFinalize) {
            const finalizeHint = hasNoMatchItems
              ? "Resolve all 'No match' items first."
              : "Finalize your selections (this will save changes and finalize selections).";
            
            const previewHint = hasNoMatchItems
              ? "Resolve 'No match' items. Updates won't be saved until then."
              : "Save changes and preview (this will only save, not finalize).";

            return (
              <>
                <Tooltip content={previewHint} position="top">
                  <Button 
                    onClick={handlePreviewNavigate} 
                    disabled={isSaving || hasNoMatchItems || !canEdit}
                    variant="default"
                  >
                    {isSaving ? "Saving..." : "Preview"}
                  </Button>
                </Tooltip>
                <Tooltip content={finalizeHint} position="top">
                  <Button
                    onClick={async () => {
                      const success = await handleFinalizeSelections(userSelections);
                      if (success) {
                        setUserSelections({});
                        setSelectionsResetKey((k) => k + 1);
                      }
                    }}
                    disabled={isFinalizing || isSaving || !hasSelections || hasNoMatchItems}
                    variant="cta"
                  >
                    {isFinalizing
                      ? "Finalizing..."
                      : `Finalize (${Object.keys(userSelections).length} pending)`}
                  </Button>
                </Tooltip>
              </>
            );
          }

          // Show only Preview button when there are no pending selections
          const previewDisabled = isSaving || !canEdit;
          const previewHint = hasNoMatchItems
            ? "Resolve 'No match' items. Updates won't be saved until then."
            : ((hasFalseMatchItems && !isApproved)
              ? "Will save updates now. Resolve selection-required items to allow navigation."
              : (!canEdit ? "You don't have permission to edit/preview quotations" : "Preview the formatted quotation"));

          return (
            <Tooltip content={previewHint} position="top">
              <Button onClick={handlePreviewNavigate} disabled={previewDisabled}>
                {isSaving ? "Saving..." : "Preview"}
              </Button>
            </Tooltip>
          );
        })()}
      </div>
    </div>
  );
};

export default QuotationDetailsPage;
