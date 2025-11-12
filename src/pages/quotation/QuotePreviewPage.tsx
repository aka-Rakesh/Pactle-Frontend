import React, { useState, useEffect, useRef } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { flushSync } from "react-dom";
import { useParams, Link } from "react-router-dom";
import {
  IconChevronLeft,
  IconDownload,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconHistory,
} from "@tabler/icons-react";
import type { Quotation, QuotationStatus } from "../../types/common";
import { useQuotationDetails, useApproveQuotation } from "../../hooks";
import { useQuotationStore } from "../../stores";
import quotationApi from "../../api/quotation";
import { Button } from "../../components/ui/Button";
import NorpackLogo from "../../components/ui/NorpackLogo";
import { useClientConfig } from "../../hooks/useClientConfig";
import { getClientConfigWithClientId } from "../../constants/clientConfig";
import { toast } from "sonner";
import { Loading } from "../../components/ui/Loading";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AuditPanel from "../../components/audit/AuditPanel";

const QuotePreviewPage: React.FC = () => {
  const { rfqId } = useParams<{ rfqId: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const documentRef = useRef<HTMLDivElement>(null);
  const brandRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [brandEditOpen, setBrandEditOpen] = useState<Record<string, boolean>>(
    {}
  );
  const [brandEdits, setBrandEdits] = useState<
    Record<
      string,
      {
        recipient: string;
        customer_address: string;
        customer_phone: string;
        subject: string;
        intro: string;
        terms: string;
        note: string;
        closing: string;
      }
    >
  >({});
  const [activeBrandTab, setActiveBrandTab] = useState<string>("");
  const [showAudit, setShowAudit] = useState<boolean>(false);
  const {
    data: apiDetails,
    isLoading: apiLoading,
    error: apiError,
  } = useQuotationDetails(rfqId);
  const approveMutation = useApproveQuotation();
  const { getQuotationByRfqId } = useQuotationStore();
  const { business, branding } = useClientConfig();
  const { can } = usePermissions();
  const canEdit = can("quotations.edit");

  useEffect(() => {
    const loadQuotation = async () => {
      if (!rfqId) return;

      setIsLoading(true);
      try {
        const storeQuotation = getQuotationByRfqId(rfqId);
        const apiResponse = apiDetails;
        if (apiResponse) {

          const allLineItems: any[] = [];
          Object.values(apiResponse?.brands || {}).forEach((brand: any) => {
            if (brand.line_items) {
              allLineItems.push(...brand.line_items);
            }
          });
          // Convert API response to local quotation format
          const formattedDate = apiResponse?.created_at
            ? new Date(apiResponse.created_at).toISOString().split("T")[0]
            : "";
          let convertedQuotation: Quotation = {
            id: apiResponse?.quote_id || "",
            quote_id: apiResponse?.quote_id || "",
            reference_number: apiResponse?.reference_number || "",
            rfqId: apiResponse?.quote_id || "",
            date: formattedDate,
            customer_info: {
              customer_name: apiResponse?.customer_info?.customer_name || "",
              customer_email: apiResponse?.customer_info?.customer_email || "",
              customer_phone: apiResponse?.customer_info?.customer_phone || "",
              customer_address:
                apiResponse?.customer_info?.customer_address || "",
            },
            amount: apiResponse?.overall_totals?.total_amount || 0,
            lastUpdate: new Date().toISOString(),
            status:
              (apiDetails?.status?.toLowerCase() as QuotationStatus) ||
              "processed",
            globalTaxRate: apiDetails.overall_totals.tax_rate,
            globalDiscountRate: apiDetails.overall_totals.discount_rate,
            items: allLineItems.map((item: any) => {
              try {
                const selectedOption =
                  item.options && item.options.length > 0
                    ? item.options[item.recommended_option || 0]
                    : null;

                return {
                  id: String(item.line_no ?? Math.random()),
                  description: item.description || "",
                  category: selectedOption?.category || "",
                  brand: selectedOption?.brand || item.brand || "",
                  size: item.size_specification || selectedOption?.size || "",
                  material_type: item.material_type || "",
                  size_specification: item.size_specification || "",
                  hsn_code: selectedOption?.hsn_code || "",
                  quantity: Number(item.quantity) || 0,
                  unitPrice: Number(
                    selectedOption?.unit_price_meter ||
                      selectedOption?.unit_price_piece ||
                      selectedOption?.lp ||
                      0
                  ),
                  unit: item.unit || "",
                  amount: item.amount,
                  match_type: item.match_type,
                  reason: item.reasoning || "",
                  line_no: item.line_no,
                  options: item.options || [],
                  recommended_option: item.recommended_option,
                  original_description: item.description || "",
                };
              } catch (error) {
                console.warn("Error processing line item:", error);
                return {
                  id: String(item.line_no ?? Math.random()),
                  description: item.description || "",
                  category: "",
                  brand: item.brand || "",
                  size: item.size_specification || "",
                  material_type: item.material_type || "",
                  size_specification: item.size_specification || "",
                  hsn_code: "",
                  quantity: Number(item.quantity) || 0,
                  unitPrice: 0,
                  unit: item.unit || "",
                  amount: item.amount,
                  match_type: item.match_type,
                  reason: item.reasoning || "",
                  line_no: item.line_no,
                  options: item.options || [],
                  recommended_option: item.recommended_option,
                  original_description: item.description || "",
                };
              }
            }),
            subtotal: apiResponse?.overall_totals?.subtotal || 0,
            totalAmountDue: apiResponse?.overall_totals?.total_amount || 0,
          };

          setQuotation(convertedQuotation);
        } else if (storeQuotation) {
          setQuotation(storeQuotation);
        }
      } catch (error) {
        console.error("Error loading quotation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotation();
  }, [rfqId, apiDetails, getQuotationByRfqId]);

  useEffect(() => {
    if (rfqId) {
      const storeQuotation = getQuotationByRfqId(rfqId);
      if (storeQuotation) {
        setQuotation(storeQuotation);
      }
    }
  }, [rfqId, getQuotationByRfqId]);

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            handleZoomIn();
            break;
          case "-":
            event.preventDefault();
            handleZoomOut();
            break;
          case "0":
            event.preventDefault();
            handleZoomReset();
            break;
          case "1":
            event.preventDefault();
            handleZoomFit();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle window resize for responsive zoom
  useEffect(() => {
    const handleResize = () => {
      // Adjust zoom level on window resize for better responsiveness
      if (zoomLevel > 100) {
        const container = documentRef.current?.parentElement;
        if (container) {
          const containerWidth = container.clientWidth - 32;
          const documentWidth = 800;
          const maxFitLevel = Math.min(
            (containerWidth / documentWidth) * 100,
            100
          );
          if (zoomLevel > maxFitLevel) {
            setZoomLevel(Math.max(maxFitLevel, 50));
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [zoomLevel]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getBrandDefaults = (brandKey: string) => {
    const assets = resolveBrandAssets(String(brandKey));
    const brandDisplay = assets.displayName || String(brandKey);
    const baseDate = quotation?.date || new Date().toISOString();    
    const termsText = business.terms;
    const noteText = business.note;
    const closingContact = business.contact;

    return {
      recipient: quotation?.customer_info?.customer_name || "",
      customer_address: quotation?.customer_info?.customer_address || "",
      customer_phone: quotation?.customer_info?.customer_phone || "",
      subject: `Our Quotation for '${
        brandDisplay || " "
      }' ISI Marked (IS: 9537.1983) Rigid PVC Conduit Pipe & allied Fittings ISI Marked (3419.1988).`,
      intro: `Dear Sir,\n\nThis has reference to our discussion on dated ${formatDate(
        baseDate
      )}, regarding subject mentioned. In this regards we are submitting hereunder our Quotation along with following Terms & Conditions.`,
      terms: termsText,
      note: noteText,
      closing: `We hope you would find our rates competitive & favor us with your valuable order.\nThanking you and assuring you our best services and co-operation always.\nYours Faithfully\n\n${
        assets.closingLine || ""
      }\n\n${closingContact}`,
    };
  };

  const isHiddenBrand = (key: string) => {
    const name = (key || "").trim().toLowerCase();
    return name === "unknown" || name === "n/a" || name === "na";
  };

  useEffect(() => {
    if (!apiDetails || !quotation) return;
    const next: Record<
      string,
      {
        recipient: string;
        customer_address: string;
        customer_phone: string;
        subject: string;
        intro: string;
        terms: string;
        note: string;
        closing: string;
      }
    > = { ...brandEdits } as any;
    const validBrands = Object.keys((apiDetails as any)?.brands || {}).filter(
      (key) => key && !isHiddenBrand(String(key)) && (apiDetails as any)?.brands?.[key]?.brand_name
    );

    validBrands.forEach((key) => {
      if (!next[key]) {
        next[key] = getBrandDefaults(key);
      }
    });
    if (Object.keys(next).length !== Object.keys(brandEdits).length) {
      setBrandEdits(next);
    }

    if (!activeBrandTab && validBrands.length > 0) {
      setActiveBrandTab(validBrands[0]);
    }
  }, [apiDetails, quotation, activeBrandTab]);

  const resolveBrandAssets = (brandKey: string) => {
    const upper = (brandKey || "").toUpperCase();
    const brands = (branding && (branding as any).brands) || {};

    let globalBrands: Record<string, any> = { ...brands };
    try {
      const akg = getClientConfigWithClientId("akg").branding.brands || {};
      const norpack = getClientConfigWithClientId("norpack").branding.brands || {};
      const stellaris = getClientConfigWithClientId("stellaris").branding.brands || {};
      globalBrands = {
        ...akg,
        ...norpack,
        ...stellaris,
        ...globalBrands,
      };
    } catch (_e) {
    }

    const brandConfig =
      (globalBrands as any)[upper] ||
      (globalBrands as any)[brandKey] ||
      {};

    return {
      logo: (brandConfig as any).logo || "",
      qr: (brandConfig as any).qr || "",
      signature:
        (brandConfig as any).signature || `${window.location.origin}/Signature.jpg`,
      displayName: (brandConfig as any).displayName || brandKey,
      closingLine: (brandConfig as any).closingLine || "",
    } as const;
  };

  const buildBrandItems = (brand: any) => {
    const items = (brand?.line_items || []).map((item: any) => {
      const optionIndex =
        typeof item?.recommended_option === "number"
          ? item.recommended_option
          : 0;
      const selectedOption = (item?.options || [])[optionIndex] || null;

      let derivedUnitPrice: number | null = null;
      if (
        selectedOption &&
        (selectedOption as any).unit_price_meter != null
      ) {
        derivedUnitPrice = Number((selectedOption as any).unit_price_meter);
      } else if (
        selectedOption &&
        (selectedOption as any).unit_price_piece != null
      ) {
        derivedUnitPrice = Number((selectedOption as any).unit_price_piece);
      } else if (selectedOption && (selectedOption as any).lp != null) {
        derivedUnitPrice = Number((selectedOption as any).lp);
      } else if ((item as any).unit_price != null) {
        derivedUnitPrice = Number((item as any).unit_price);
      } else {
        derivedUnitPrice = 0;
      }

      return {
        id: String(item?.line_no ?? Math.random()),
        brand: item?.brand,
        category: item?.category || (selectedOption && (selectedOption as any).category) || "",
        size: item?.size_specification || (selectedOption && (selectedOption as any).size) || "",
        hsn_code: item?.hsn_code || (selectedOption && (selectedOption as any).hsn_code) || "",
        quantity: Number(item?.quantity ?? 0),
        unitPrice: derivedUnitPrice,
        amount: item?.total_price,
      };
    });
    return items;
  };

  const normalizedString = (value: string) => {
    return (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const resolveApprovedAttachmentForBrand = (brandKey?: string) => {
    const status = (apiDetails?.status || "").toLowerCase();
    if (status !== "approved") return "";
    const attachments = ((((apiDetails as any) || {}).attachments) || []) as any[];
    if (!Array.isArray(attachments) || attachments.length === 0) return "";

    const isPdfAttachment = (att: any) => String(att?.content_type || "").toLowerCase().includes("pdf");
    const isQuotationPdf = (att: any) => String(att?.s3_metadata?.file_type || "").toLowerCase() === "quotation_pdf";

    if (brandKey) {
      const safeBrand = normalizedString(String(brandKey));
      const candidates = attachments.filter((att: any) => isPdfAttachment(att) && isQuotationPdf(att));
      const byMetadataBrand = candidates.find((att: any) => {
        const metaBrand = normalizedString(String(att?.s3_metadata?.brand || att?.s3_metadata?.brand_name || ""));
        return metaBrand && metaBrand === safeBrand;
      });
      if (byMetadataBrand?.presigned_url) return byMetadataBrand.presigned_url;

      const byFilename = candidates.find((att: any) => {
        const fname = normalizedString(String(att?.filename || ""));
        return fname.includes(safeBrand);
      });
      if (byFilename?.presigned_url) return byFilename.presigned_url;
    }

    const generic = attachments.find((att: any) => isPdfAttachment(att) && (att?.is_processed === false || isQuotationPdf(att)));
    return generic?.presigned_url || "";
  };

  const buildPdfViewerUrl = (url: string) => {
    if (!url) return url;
    const hasHash = url.includes('#');
    const params = 'toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH';
    if (hasHash) {
      const [base, hash] = url.split('#');
      const merged = new URLSearchParams(hash);
      params.split('&').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (!merged.has(k)) merged.set(k, v);
      });
      return `${base}#${merged.toString()}`;
    }
    return `${url}#${params}`;
  };

  const handleDownloadBrand = async (brandKey: string) => {
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
    ) {
      (active as HTMLElement).blur();
    }
    flushSync(() => {});

    if (!quotation || !apiDetails) return;

    try {
      const approvedUrlForBrand = resolveApprovedAttachmentForBrand(brandKey);
      if (approvedUrlForBrand) {
        const brandDisplaySafe = (resolveBrandAssets(brandKey).displayName || brandKey).replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `quotation-${quotation.reference_number}-${brandDisplaySafe}.pdf`;
        const a = document.createElement("a");
        a.href = approvedUrlForBrand;
        a.target = "_blank";
        a.rel = "noopener";
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Downloaded ${brandDisplaySafe} PDF`);
        return;
      }

      const brandEntries = Object.entries(
        (apiDetails as any)?.brands || {}
      ).filter(([key, brand]: any) => {
        return key === brandKey && !isHiddenBrand(String(key)) && brand?.brand_name;
      });

      if (brandEntries.length === 0) {
        toast.error("Brand not found");
        return;
      }

      const [key, brand] = brandEntries[0];
      const assets = resolveBrandAssets(key);
      const items = buildBrandItems(brand);
      const brandDisplay = assets.displayName || key;
      const projectInfo: any = (apiDetails as any)?.project_info || (apiDetails as any)?.parsed_data?.project_info || {};
      const projectOrCompany = String(projectInfo.project_name || projectInfo.company_name || "");
      const currentBrandEdits = { ...brandEdits };
      const edited = currentBrandEdits && (currentBrandEdits as any)[key]
        ? (currentBrandEdits as any)[key]
        : getBrandDefaults(key);

      const totalAmount = Number((brand as any)?.totals?.total_amount || 0);

      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = 'Inter, Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.color = '#333';
      document.body.appendChild(tempContainer);

      // Generate HTML content for the PDF
      const termsHtml = (edited.terms || "")
        .split("\n")
        .filter(Boolean)
        .map((t: string, idx: number) => `<li>${idx + 1}. ${t.replace(/^\d+\.\s*/, "")}</li>`)
        .join("");

      const showBranding = Boolean(assets.logo || assets.qr);

      tempContainer.innerHTML = `
        <div style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            ${showBranding && assets.logo ? `<img src="${assets.logo}" alt="${brandDisplay} Logo" style="height: 60px; width: auto; margin-bottom: 8px;" />` : ""}
          </div>
          <div style="text-align: right; font-size: 14px; color: #666;">
            <div>Ref. ${quotation.reference_number}</div>
            <div>Date: ${formatDate(quotation.date || new Date().toISOString())}</div>
          </div>
        </div>

        <div style="margin: 30px 0;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">M/s ${(edited.recipient || quotation?.customer_info?.customer_name) + (projectOrCompany ? ` — ${projectOrCompany}` : "")}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${edited.customer_address || quotation?.customer_info?.customer_address || ""}</div>
          ${edited.customer_phone || quotation?.customer_info?.customer_phone ? `<div style="font-size: 14px; color: #666; margin-bottom: 4px;">Phone: ${edited.customer_phone || quotation?.customer_info?.customer_phone}</div>` : ""}
        </div>

        <div style="margin: 20px 0;">
          <div style="font-size: 14px; line-height: 1.4;">
            <span style="color: #666; margin-right: 8px;">Sub:</span>
            <span style="font-weight: 500;">${edited.subject ?? `Our Quotation ${brandDisplay ? `for '${brandDisplay}' ` : ""}ISI Marked (IS: 9537.1983) Rigid PVC Conduit Pipe & allied Fittings ISI Marked (3419.1988).`}</span>
          </div>
        </div>

        <div style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
          ${(edited.intro || "").split("\n").map((p: string) => `<p>${p}</p>`).join("") || `<p>Dear Sir,</p><p>This has reference to our discussion on dated ${formatDate(quotation.date || new Date().toISOString())}, regarding subject mentioned. In this regards we are submitting hereunder our Quotation along with following Terms & Conditions.</p>`}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Sl. No.</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Item Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Size in mm</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">HSN Code</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Qty.in Mtr./Nos.</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Rate Rs. Mtr./Nos.</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Rs.</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item: any, index: number) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.brand} ${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.size || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.hsn_code || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${(item.quantity || 0).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(item.unitPrice)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatCurrency(item.finalAmount || item.amount)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <div style="font-weight: 700; font-size: 16px; border: 1px solid #ddd; border-top: none; padding: 8px 12px; background: #ffffff;">Total Amount Rs.: ${formatCurrency(totalAmount)}</div>
        </div>

        <div class="terms-section" style="margin: 30px 0;">
          <div style="max-width: 720px;">
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 15px;">Terms & Conditions:</div>
            <div style="font-size: 12px; line-height: 1.5;">
              <ol style="margin: 0; padding-left: 20px;">
                ${termsHtml}
              </ol>
            </div>
          </div>
        </div>

        <div class="note-section" style="font-size: 12px; margin: 20px 0;">
          ${(edited.note || "").replace(/</g, "&lt;")}
        </div>

        <div class="closing-section" style="margin: 30px 0;">
          ${(edited.closing || "").split("\n").map((p: string) => `<p>${p}</p>`).join("")}
          ${assets.signature ? `<div style="margin-top: 8px;"><img src="${assets.signature}" alt="Signature" style="height: 64px; width: auto;" /></div>` : ""}
        </div>

        ${showBranding && assets.qr ? `
          <div class="footer-section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; background: #f8f9fa; padding: 20px; border-radius: 4px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="display: flex; justify-content: center; align-items: center;">
                <img src="${assets.qr}" alt="QR Code" style="width: 96px; height: 96px;" />
              </div>
              <div style="text-align: left;">
                <div><strong>${brandDisplay}</strong></div>
                ${assets.displayName?.includes("NORPACK") ? `
                  <div style="font-size: 11px; color: #666; margin-top: 4px; line-height: 1.4;">
                    <div>Corporate office: B-39, Sector-81, Phase-2, Noida-201305, UP</div>
                    <div>Tel: 0120-4523400</div>
                    <div>Works: B-20 Phase-2, Noida-201305, UP</div>
                    <div>Tel: 0120-4277036/37. E-mail: info@norpack.in</div>
                  </div>
                ` : assets.displayName?.includes("AKG") ? `
                  <div style="font-size: 11px; color: #666; margin-top: 4px; line-height: 1.4;">
                    <div>B-39, Sector-81, Phase-2, Noida-201305, U.P.</div>
                    <div>Tel.: 0120-4523400</div>
                    <div>E-mail: sales@akgsteelind.com</div>
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        ` : ""}
      `;

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const containerRect = tempContainer.getBoundingClientRect();
      const tableBody = tempContainer.querySelector('table tbody') as HTMLElement | null;
      const rows = Array.from((tableBody || tempContainer).querySelectorAll('tr')) as HTMLElement[];
      const footerEl = tempContainer.querySelector('.footer-section') as HTMLElement | null;
      const termsEl = tempContainer.querySelector('.terms-section') as HTMLElement | null;
      const closingEl = tempContainer.querySelector('.closing-section') as HTMLElement | null;

      const elementTotalHeight = tempContainer.scrollHeight || containerRect.height || canvas.height;
      const pxToCanvas = canvas.height / elementTotalHeight;

      const rowBottomsCanvas = rows
        .map((tr) => {
          const r = tr.getBoundingClientRect();
          return Math.max(0, (r.bottom - containerRect.top) * pxToCanvas);
        })
        .filter((y) => y > 0 && y < canvas.height)
        .sort((a, b) => a - b);

      const footerTopCanvas = footerEl
        ? Math.max(0, (footerEl.getBoundingClientRect().top - containerRect.top) * pxToCanvas)
        : null;

      const breakPositionsCanvas: number[] = [...rowBottomsCanvas];
      if (footerTopCanvas != null && footerTopCanvas > 0 && footerTopCanvas < canvas.height) {
        breakPositionsCanvas.push(footerTopCanvas);
        breakPositionsCanvas.sort((a, b) => a - b);
      }

      const protectedRegionsCanvas: Array<{ start: number; end: number }> = [];
      const toRegion = (el: HTMLElement | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const start = Math.max(0, (r.top - containerRect.top) * pxToCanvas);
        const end = Math.max(0, (r.bottom - containerRect.top) * pxToCanvas);
        if (end > start) return { start, end };
        return null;
      };
      [termsEl, closingEl, footerEl].forEach((el) => {
        const reg = toRegion(el as HTMLElement | null);
        if (reg && reg.end <= canvas.height) protectedRegionsCanvas.push(reg);
      });

      const canvasToPdfScale = imgHeight / canvas.height; // points per canvas pixel
      const breakPositionsPdf = breakPositionsCanvas.map((bp) => bp * canvasToPdfScale);
      const protectedRegionsPdf = protectedRegionsCanvas.map((r) => ({ start: r.start * canvasToPdfScale, end: r.end * canvasToPdfScale }));

      if (imgHeight <= usableHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        let yOffset = 0;
        let remainingHeight = imgHeight;

        while (remainingHeight > 0) {
          const idealEnd = yOffset + usableHeight;
          const prevBreakRaw = [...breakPositionsPdf].filter((bp) => bp > yOffset && bp <= idealEnd).pop();
          const prevBreakIsClose = prevBreakRaw ? (idealEnd - prevBreakRaw) <= 120 : false; // only snap if close to page end
          const prevBreak = prevBreakIsClose ? prevBreakRaw : undefined;
          let pageImgHeight = prevBreak ? prevBreak - yOffset : Math.min(usableHeight, remainingHeight);

          const intersecting = protectedRegionsPdf.find((r) => r.start < idealEnd && r.end > yOffset);
          if (intersecting) {
            if ((idealEnd - intersecting.start) <= 120 && (intersecting.start - yOffset) >= usableHeight * 0.5) {
              pageImgHeight = Math.min(pageImgHeight, intersecting.start - yOffset);
            } else if ((intersecting.end - yOffset) <= usableHeight) {
              pageImgHeight = Math.max(pageImgHeight, intersecting.end - yOffset);
            } else {
              pageImgHeight = Math.min(usableHeight, remainingHeight);
            }
          }

          if (pageImgHeight < 40) {
            pageImgHeight = Math.min(usableHeight, remainingHeight);
          }

          const sourceY = yOffset / canvasToPdfScale;
          const sourceHeight = pageImgHeight / canvasToPdfScale;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = Math.ceil(sourceHeight);
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sourceHeight,
              0,
              0,
              canvas.width,
              sourceHeight
            );
            const tempImgData = tempCanvas.toDataURL('image/png');
            if (yOffset > 0) {
              pdf.addPage();
            }
            pdf.addImage(tempImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
          }

          yOffset += pageImgHeight;
          remainingHeight -= pageImgHeight;
        }
      }

      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Download the PDF
      const filename = `quotation-${quotation.reference_number}-${brandDisplay.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      pdf.save(filename);

      toast.success(`Downloaded ${brandDisplay} PDF`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadAllBrands = async () => {
    if (!quotation || !apiDetails) return;

    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
    ) {
      (active as HTMLElement).blur();
    }
    flushSync(() => {});

    const validBrands = Object.entries((apiDetails as any)?.brands || {})
      .filter(([key, brand]: any) => key && !isHiddenBrand(String(key)) && brand?.brand_name);

    if (validBrands.length === 0) {
      toast.error("No brands available for download");
      return;
    }

    try {
      const status = (apiDetails?.status || '').toLowerCase();
      if (status === 'approved') {
        const urlsToOpen: Array<{ key: string; url: string }> = [];
        const fallbackKeys: string[] = [];
        for (const [brandKey] of validBrands) {
          const key = String(brandKey);
          const url = resolveApprovedAttachmentForBrand(key);
          if (url) {
            urlsToOpen.push({ key, url });
          } else {
            fallbackKeys.push(key);
          }
        }

        urlsToOpen.forEach((entry, idx) => {
          setTimeout(() => {
            try {
              window.open(entry.url, '_blank', 'noopener');
            } catch (_e) {}
          }, idx * 50);
        });

        for (const key of fallbackKeys) {
          await handleDownloadBrand(key);
          await new Promise((r) => setTimeout(r, 75));
        }

        const totalCount = urlsToOpen.length + fallbackKeys.length;
        if (totalCount > 0) {
          toast.success(`Opened/Downloaded ${totalCount} brand PDF(s)`);
        } else {
          toast.error('No brand PDFs available to open');
        }
        return;
      }

      for (const [brandKey] of validBrands) {
        await handleDownloadBrand(brandKey as string);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast.success(`Downloaded ${validBrands.length} brand PDF(s)`);
    } catch (error) {
      console.error("Error downloading all brands:", error);
      toast.error("Failed to download some brand PDFs");
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const newLevel = Math.min(prev + 10, 200);
      return newLevel;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newLevel = Math.max(prev - 10, 50);
      return newLevel;
    });
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleZoomFit = () => {
    // Calculate fit to screen based on container width
    const container = documentRef.current?.parentElement;
    if (container) {
      const containerWidth = container.clientWidth - 32; // Account for padding
      const documentWidth = 800; // Base document width
      const fitLevel = Math.min((containerWidth / documentWidth) * 100, 100);
      setZoomLevel(Math.max(fitLevel, 50));
    } else {
      setZoomLevel(75);
    }
  };

  const handleApproveQuotation = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit quotations");
      return;
    }
    if (!rfqId || !quotation || !apiDetails) return;
    const q = quotation;

    try {
      await approveMutation.mutateAsync(rfqId);
      if (q) {
        const updated = { ...q, status: "approved" as any };
        setQuotation(updated);
        window.dispatchEvent(
          new CustomEvent("quotationStatusChange", {
            detail: { status: updated.status, rfqId },
          })
        );
      }

      try {
        const formData = new FormData();
        formData.append(
          "quotation_id",
          String((apiDetails as any)?.quote_id || rfqId)
        );

        const brands = Object.entries((apiDetails as any)?.brands || {});
        let appendedCount = 0;
        const pdfFiles: File[] = [];

        for (const [key, brand] of brands as any[]) {
          const safeKey = String(key)
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, "-");
          const filename = `${
            (apiDetails as any)?.quote_id || rfqId
          }-${safeKey}.pdf`;

          try {
            // Generate HTML content similar to handleDownload
            const assets = resolveBrandAssets(key);
            const items = buildBrandItems(brand);
            // const subtotal = Number((brand as any)?.totals?.subtotal || 0);
            // const taxAmount = Number((brand as any)?.totals?.tax_amount || 0);
            const totalAmount = Number((brand as any)?.totals?.total_amount || 0);
            // const discountRate = Number(q.globalDiscountRate || 0);
            // const discountAmount = (subtotal * discountRate) / 100;
            const brandDisplay = assets.displayName || key;
            const currentBrandEdits = { ...brandEdits };
            const edited = currentBrandEdits && (currentBrandEdits as any)[key]
                ? (currentBrandEdits as any)[key]
                : getBrandDefaults(key);
            const termsHtml = (edited.terms || "")
              .split("\n")
              .filter(Boolean)
              .map((t: string) => `<li>${t.replace(/^\d+\.\s*/, "")}</li>`)
              .join("");

            const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Quotation - ${q.reference_number}</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                  
                  * { box-sizing: border-box; }
                  body { 
                    font-family: 'Inter', Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: #ffffff;
                    color: #333;
                  }
                  .document-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 40px;
                  }
                  .header { 
                    margin-bottom: 30px; 
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                  }
                  .logo-section {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                  }
                  .logo-image {
                    height: 60px;
                    width: auto;
                    margin-bottom: 8px;
                  }
                  .reference-info {
                    text-align: right;
                    font-size: 14px;
                    color: #666;
                  }
                  .customer-info {
                    margin: 30px 0;
                  }
                  .customer-name {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 8px;
                  }
                  .customer-address {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 4px;
                  }
                  .subject-line {
                    margin: 20px 0;
                  }
                  .subject-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 8px;
                  }
                  .subject-text {
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 1.4;
                  }
                  .intro-text {
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 20px 0;
                  }
                  table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                    font-size: 12px;
                  }
                  th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                    vertical-align: top;
                  }
                  th { 
                    background-color: #f8f9fa; 
                    font-weight: 600;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  .totals-section {
                    text-align: right;
                  }
                  .total-line {
                    font-size: 14px;
                  }
                  .total-amount {
                    font-weight: 700;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    border-top: none;
                    padding: 8px 12px;
                    background: #ffffff;
                  }
                  .terms-section {
                    margin: 30px 0;
                  }
                  .terms-title {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 15px;
                  }
                  .terms-list {
                    font-size: 12px;
                    line-height: 1.5;
                  }
                  .terms-list ol {
                    margin: 0;
                    padding-left: 20px;
                    list-style: decimal;
                  }
                  .terms-list li {
                    margin-bottom: 8px;
                  }
                  .contact-note {
                    font-size: 12px;
                  }
                  .closing-section {
                    margin: 30px 0;
                  }
                  .footer-section {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 4px;
                  }
                  .footer-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                  }
                  .page { page-break-after: always; }
                  .page:last-child { page-break-after: auto; }
                </style>
              </head>
              <body>
                <div class="document-container page">
                  <div class="header">
                    <div class="logo-section">
                      ${
                        assets.logo
                          ? `<img src="${assets.logo}" alt="${brandDisplay} Logo" class="logo-image" />`
                          : ""
                      }
                    </div>
                    <div class="reference-info">
                      <div>Ref. ${q.reference_number}</div>
                      <div>Date: ${formatDate(
                        q.date || new Date().toISOString()
                      )}</div>
                    </div>
                  </div>
                  <div class="customer-info">
                    <div class="customer-name">M/s ${
                      (() => {
                        const pj = (apiDetails as any)?.project_info || (apiDetails as any)?.parsed_data?.project_info || {};
                        const suffix = pj?.project_name || pj?.company_name || '';
                        const base = edited.recipient || q?.customer_info?.customer_name || '';
                        return suffix ? `${base} — ${suffix}` : base;
                      })()
                    }</div>
                    ${
                      edited.customer_address ||
                      q?.customer_info?.customer_address
                        ? `<div class="customer-address">${
                            edited.customer_address ||
                            q?.customer_info?.customer_address
                          }</div>`
                        : ""
                    }
                    ${
                      edited.customer_phone || q?.customer_info?.customer_phone
                        ? `<div class="customer-address">phone: ${
                            edited.customer_phone ||
                            q?.customer_info?.customer_phone
                          }</div>`
                        : ""
                    }
                  </div>
                  <div class="subject-line" style="display:flex; gap:8px; align-items:flex-start;">
                    <div class="subject-label">Sub:</div>
                    <div class="subject-text">${
                      edited.subject ??
                      `Our Quotation ${brandDisplay ? `for '${brandDisplay}' ` : ""}ISI Marked (IS: 9537.1983) Rigid PVC Conduit Pipe & allied Fittings ISI Marked (3419.1988).`
                    }</div>
                  </div>
                  <div class="intro-text">
                    ${
                      (edited.intro || "")
                        .split("\n")
                        .map((p: string) => `<p>${p}</p>`)
                        .join("") ||
                      `<p>Dear Sir,</p><p>This has reference to our discussion on dated ${formatDate(
                        q.date || new Date().toISOString()
                      )}, regarding subject mentioned. In this regards we are submitting hereunder our Quotation along with following Terms & Conditions.</p>`
                    }
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Sl. No.</th>
                        <th>Item Description</th>
                        <th>Size in mm</th>
                        <th>HSN Code</th>
                        <th>Qty.in Mtr./Nos.</th>
                        <th>Rate Rs. Mtr./Nos.</th>
                        <th>Amount Rs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${items
                        .map(
                          (item: any, index: number) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item?.brand} ${item.category}</td>
                          <td>${item.size || "-"}</td>
                          <td>${item.hsn_code || "-"}</td>
                          <td>${(item.quantity || 0).toLocaleString()}</td>
                          <td>${formatCurrency(item.unitPrice)}</td>
                          <td>${formatCurrency(item.finalAmount || item.amount)}</td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>
                  <div class="totals-section">
                    <div class="total-amount">Total Amount Rs.: ${formatCurrency(
                      totalAmount
                    )}</div>
                  </div>
                  <div class="terms-section">
                    <div class="terms-title">Terms & Conditions:</div>
                    <div class="terms-list"><ol>${termsHtml}</ol></div>
                  </div>
                  <div class="contact-note">${(edited.note || "").replace(
                    /</g,
                    "&lt;"
                  )}</div>
                  <div class="closing-section">${(edited.closing || "")
                    .split("\n")
                    .map((p: string) => `<p>${p}</p>`)
                    .join("")}
                    ${assets.signature ? `<div style="margin-top: 8px;"><img src="${assets.signature}" alt="Signature" style="height: 64px; width: auto;" /></div>` : ""}
                  </div>
                  ${
                    assets.qr
                      ? `
                    <div class="footer-section">
                      <div class="footer-content">
                        <div style="display:flex;justify-content:center;align-items:center;"><img src="${
                          assets.qr
                        }" alt="QR Code" style="width: 96px; height: 96px;" /></div>
                        <div>
                          <div><strong>${brandDisplay}</strong></div>
                          ${
                            assets.displayName?.includes("NORPACK")
                              ? `
                            <div style="font-size: 11px; color: #666; margin-top: 4px; line-height: 1.4;">
                              <div>Corporate office: B-39, Sector-81, Phase-2, Noida-201305, UP</div>
                              <div>Tel: 0120-4523400</div>
                              <div>Works: B-20 Phase-2, Noida-201305, UP</div>
                              <div>Tel: 0120-4277036/37. E-mail: info@norpack.in</div>
                            </div>`
                              : ""
                          }
                        </div>
                      </div>
                    </div>`
                      : ""
                  }
                </div>
              </body>
            </html>
          `;

            // Create a temporary iframe to render the HTML
            const iframe = document.createElement("iframe");
            iframe.style.position = "absolute";
            iframe.style.top = "-9999px";
            iframe.style.left = "-9999px";
            iframe.style.width = "1000px";
            iframe.style.height = "1200px";
            document.body.appendChild(iframe);

            // Wait for iframe to be ready
            await new Promise((resolve) => {
              iframe.onload = resolve;
              iframe.srcdoc = htmlContent;
            });

            // Wait a bit more for fonts and images to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            const iframeDocument =
              iframe.contentDocument || iframe.contentWindow?.document;
            const targetElement = iframeDocument?.body.querySelector(
              ".document-container"
            );

            if (targetElement) {
              // Generate canvas from the iframe content
              const canvas = await html2canvas(targetElement as HTMLElement, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#ffffff",
                width: 800,
                height: targetElement.scrollHeight,
              });

              // Clean up iframe
              document.body.removeChild(iframe);

              if (canvas.width > 0 && canvas.height > 0) {
                const imgData = canvas.toDataURL("image/jpeg", 0.7);

                if (imgData !== "data:,") {
                  const pdf = new jsPDF({
                    orientation: "p",
                    unit: "pt",
                    format: "a4",
                  });
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const margin = 24;
                  const usableWidth = pageWidth - margin * 2;
                  const usableHeight = pageHeight - margin * 2;
                
                  const imgWidth = usableWidth;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  const bodyEl = (iframeDocument && iframeDocument.body) ? (iframeDocument.body as HTMLElement) : null;
                  const tbodyEl = bodyEl ? (bodyEl.querySelector("table tbody") as HTMLElement | null) : null;
                  const queryRoot: HTMLElement | null = tbodyEl ?? bodyEl;
                  const rows = Array.from(queryRoot ? queryRoot.querySelectorAll("tr") : []) as HTMLElement[];
                  const containerRect = (targetElement as HTMLElement).getBoundingClientRect();
                  const elementTotalHeight = ((targetElement as HTMLElement).scrollHeight || containerRect.height);
                  const pxToCanvas = canvas.height / elementTotalHeight;
                  const breakPositionsCanvas = rows
                    .map((tr) => {
                      const r = tr.getBoundingClientRect();
                      return Math.max(0, (r.bottom - containerRect.top) * pxToCanvas);
                    })
                    .filter((y) => y > 0)
                    .sort((a, b) => a - b);
                  const canvasToPdfScale = imgHeight / canvas.height; // points per canvas pixel
                  const breakPositionsPdf = breakPositionsCanvas.map((bp) => bp * canvasToPdfScale);

                  if (imgHeight <= usableHeight) {
                    // Single page
                    pdf.addImage(
                      imgData,
                      "JPEG",
                      margin,
                      margin,
                      imgWidth,
                      imgHeight
                    );
                  } else {
                    // Multiple pages
                    let yOffset = 0;
                    let remainingHeight = imgHeight;

                    while (remainingHeight > 0) {
                      const idealEnd = yOffset + usableHeight;
                      const prevBreak = [...breakPositionsPdf]
                        .filter((bp) => bp > yOffset && bp <= idealEnd)
                        .pop();
                      let pageImgHeight = prevBreak ? prevBreak - yOffset : Math.min(usableHeight, remainingHeight);
                      if (pageImgHeight < usableHeight * 0.3 && remainingHeight > usableHeight) {
                        pageImgHeight = usableHeight;
                      }
                      const sourceY = yOffset / canvasToPdfScale;
                      const sourceHeight = pageImgHeight / canvasToPdfScale;

                      const tempCanvas = document.createElement("canvas");
                      tempCanvas.width = canvas.width;
                      tempCanvas.height = Math.ceil(sourceHeight);
                      const tempCtx = tempCanvas.getContext("2d");

                      if (tempCtx) {
                        tempCtx.drawImage(
                          canvas,
                          0,
                          sourceY,
                          canvas.width,
                          sourceHeight,
                          0,
                          0,
                          canvas.width,
                          sourceHeight
                        );
                        const tempImgData = tempCanvas.toDataURL(
                          "image/jpeg",
                          0.7
                        );

                        if (yOffset > 0) {
                          pdf.addPage();
                        }

                        pdf.addImage(
                          tempImgData,
                          "JPEG",
                          margin,
                          margin,
                          imgWidth,
                          pageImgHeight
                        );
                      }

                      yOffset += pageImgHeight;
                      remainingHeight -= pageImgHeight;
                    }
                  }

                  const pdfBlob = pdf.output("blob");
                  pdfFiles.push(
                    new File([pdfBlob], filename, { type: "application/pdf" })
                  );
                  appendedCount++;
                } else {
                  throw new Error("Empty canvas data");
                }
              } else {
                throw new Error("Canvas has zero dimensions");
              }
            } else {
              throw new Error("Target element not found in iframe");
            }
          } catch (canvasError) {
            console.error(
              `Error generating PDF for brand ${key}:`,
              canvasError
            );
            // Create fallback PDF with brand info
            const assets = resolveBrandAssets(key);
            const items = buildBrandItems(brand);
            const pdf = new jsPDF({
              orientation: "p",
              unit: "pt",
              format: "a4",
            });

            pdf.setFontSize(16);
            pdf.text(`${assets.displayName || key} Quotation`, 40, 60);
            pdf.setFontSize(12);
            pdf.text(`RFQ: ${(apiDetails as any)?.quote_id || rfqId}`, 40, 80);
            pdf.text(`Customer: ${q?.customer_info?.customer_name}`, 40, 100);
            pdf.text(
              `Date: ${formatDate(q.date || new Date().toISOString())}`,
              40,
              120
            );

            // Add items summary
            let yPos = 150;
            pdf.text("Items:", 40, yPos);
            yPos += 20;

            items.slice(0, 10).forEach((item: any, index: number) => {
              if (yPos > 750) return;
              pdf.setFontSize(10);
              const text = `${index + 1}. ${item.category.substring(0, 60)}${
                item.category.length > 60 ? "..." : ""
              }`;
              pdf.text(text, 40, yPos);
              yPos += 15;
            });

            const blob = pdf.output("blob");
            pdfFiles.push(
              new File([blob], filename, { type: "application/pdf" })
            );
            appendedCount++;
          }
        }

        if (appendedCount === 0) {
          const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
          pdf.setFontSize(16);
          pdf.text(
            `Quotation ${(apiDetails as any)?.quote_id || rfqId}`,
            40,
            60
          );
          pdf.setFontSize(12);
          pdf.text(
            `Customer: ${quotation?.customer_info?.customer_name}`,
            40,
            80
          );
          pdf.text(
            `Date: ${formatDate(quotation?.date || new Date().toISOString())}`,
            40,
            100
          );
          const blob = pdf.output("blob");
          pdfFiles.push(
            new File([blob], `${(apiDetails as any)?.quote_id || rfqId}.pdf`, {
              type: "application/pdf",
            })
          );
        }

        // Upload each PDF in a separate request to avoid 413 (payload too large)
        for (const file of pdfFiles) {
          const singleForm = new FormData();
          singleForm.append(
            "quotation_id",
            String((apiDetails as any)?.quote_id || rfqId)
          );
          singleForm.append("files", file);
          await quotationApi.uploadQuotationPdfs(singleForm);
        }
      } catch (uploadErr) {
        console.error("Upload PDFs failed:", uploadErr);
        toast.error(
          "PDF generation failed, but quotation was approved successfully."
        );
      }

      toast.success("Quotation approved successfully!");
    } catch (error) {
      console.error("Error approving quotation:", error);
      toast.error("Failed to approve quotation. Please try again.");
    }
  };

  const approvedAttachmentUrl = React.useMemo(() => {
    return resolveApprovedAttachmentForBrand();
  }, [apiDetails]);

  useEffect(() => {
    (window as any).pactlePreview = (window as any).pactlePreview || {};
    (window as any).pactlePreview.approve = handleApproveQuotation;
    (window as any).pactlePreview.getStatus = () => quotation?.status;
    (window as any).pactlePreview.downloadAllBrands = handleDownloadAllBrands;
    if (quotation?.status) {
      window.dispatchEvent(
        new CustomEvent("quotationStatusChange", {
          detail: { status: quotation.status, rfqId },
        })
      );
    }
    return () => {
      if ((window as any).pactlePreview) {
        delete (window as any).pactlePreview.approve;
        delete (window as any).pactlePreview.getStatus;
        delete (window as any).pactlePreview.downloadAllBrands;
      }
    };
  }, [rfqId, approveMutation, quotation?.status]);

  if (apiLoading || isLoading) {
    return (
      <Loading
        size="lg"
        message="Loading quotation details..."
        subMessage="Please wait while we fetch the quotation data."
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

  const renderPreviewContent = () => {
    const brandEntries = Object.entries((apiDetails as any)?.brands || {}) as Array<[
      string,
      any
    ]>;
    const validBrands = brandEntries.filter(
      ([key, brand]) => key && !isHiddenBrand(String(key)) && brand?.brand_name
    );

    if (validBrands.length > 1) {
      const urlForActive = buildPdfViewerUrl(
        resolveApprovedAttachmentForBrand(activeBrandTab)
      );

      if (urlForActive) {
        return (
          <div
            className="h-full"
            key={`pdf-${activeBrandTab}-${urlForActive}`}
            style={{ backgroundColor: "transparent" }}
          >
            <object
              data={urlForActive}
              type="application/pdf"
              className="w-full h-full rounded-lg"
              key={`obj-${activeBrandTab}`}
              style={{ background: "transparent" }}
            >
              <iframe
                src={urlForActive}
                className="w-full h-full"
                key={`iframe-${activeBrandTab}`}
                style={{ background: "transparent" }}
              />
            </object>
          </div>
        );
      }
    } else if (validBrands.length === 1) {
      const [onlyKey] = validBrands[0];
      const urlForOnly = buildPdfViewerUrl(
        resolveApprovedAttachmentForBrand(onlyKey) || approvedAttachmentUrl
      );

      if (urlForOnly) {
        return (
          <div
            className="h-full"
            key={`pdf-only-${urlForOnly}`}
            style={{ backgroundColor: "transparent" }}
          >
            <object
              data={urlForOnly}
              type="application/pdf"
              className="w-full h-full rounded-lg"
              key={`obj-only`}
              style={{ background: "transparent" }}
            >
              <iframe
                src={urlForOnly}
                className="w-full h-full"
                key={`iframe-only`}
                style={{ background: "transparent" }}
              />
            </object>
          </div>
        );
      }
    }

    return (
      <div
        ref={documentRef}
        className="rounded-lg mx-auto transition-all duration-300 ease-in-out"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: "top center",
          width: zoomLevel < 100 ? "100%" : `${100 / (zoomLevel / 100)}%`,
          maxWidth: "1400px",
        }}
      >
        {brandEntries
          .filter(([key, brand]) => {
            return key && !isHiddenBrand(String(key)) && brand?.brand_name;
          })
          .filter(([key]) => {
            if (validBrands.length > 1) {
              return key === activeBrandTab;
            }
            return true;
          })
          .map(([key, brand]) => {
            const assets = resolveBrandAssets(key);
            const items = buildBrandItems(brand);
            const totalAmount = Number(brand?.totals?.total_amount || 0);
            const brandDisplay = assets.displayName || key;
            const showBranding = Boolean(assets.logo || assets.qr);
            const edited = brandEdits[key] || getBrandDefaults(key);

            return (
              <div
                key={key}
                ref={(el) => {
                  brandRefs.current[String(key)] = el;
                }}
                className="bg-white border border-gray-200 rounded-lg shadow mb-10"
              >
                {/* Document Header */}
                <div className="p-8 border-b border-gray-200">
                  {/* Company Logo and Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      {showBranding && assets.logo ? (
                        assets.displayName?.includes("NORPACK") ? (
                          <NorpackLogo size="lg" variant="default" />
                        ) : (
                          <img
                            src={assets.logo}
                            alt={`${brandDisplay} Logo`}
                            className="h-14 w-auto"
                          />
                        )
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-light">
                        Ref. {quotation?.reference_number ?? ""}
                      </div>
                      <div className="text-sm text-gray-light">
                        Date:{" "}
                        {formatDate(
                          quotation?.date || new Date().toISOString()
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recipient Information */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {brandEditOpen[key] ? (
                          <div className="space-y-3">
                            <input
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Customer Name"
                              value={
                                edited.recipient ||
                                quotation?.customer_info?.customer_name ||
                                ""
                              }
                              onChange={(e) =>
                                setBrandEdits((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...(prev[key] || getBrandDefaults(key)),
                                    recipient: e.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Customer Address"
                              value={
                                edited.customer_address ||
                                quotation?.customer_info?.customer_address ||
                                ""
                              }
                              onChange={(e) =>
                                setBrandEdits((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...(prev[key] || getBrandDefaults(key)),
                                    customer_address: e.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Customer Phone"
                              value={
                                edited.customer_phone ||
                                quotation?.customer_info?.customer_phone ||
                                ""
                              }
                              onChange={(e) =>
                                setBrandEdits((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...(prev[key] || getBrandDefaults(key)),
                                    customer_phone: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-gray-dark mb-1">
                              M/s{" "}
                              {(() => {
                                const pj: any =
                                  (apiDetails as any)?.project_info ||
                                  (apiDetails as any)?.parsed_data?.project_info ||
                                  {};
                                const suffix =
                                  pj?.project_name || pj?.company_name || "";
                                const base =
                                  edited.recipient ||
                                  quotation?.customer_info?.customer_name ||
                                  "";
                                return suffix ? `${base} — ${suffix}` : base;
                              })()}
                            </div>
                            {(edited.customer_address ||
                              quotation?.customer_info?.customer_address) && (
                              <div className="text-sm text-gray-light mb-1">
                                {edited.customer_address ||
                                  quotation?.customer_info?.customer_address}
                              </div>
                            )}
                            {(edited.customer_phone ||
                              quotation?.customer_info?.customer_phone) && (
                              <div className="text-sm text-gray-light">
                                phone:{" "}
                                {edited.customer_phone ||
                                  quotation?.customer_info?.customer_phone}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setBrandEditOpen((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        disabled={(apiDetails?.status || "").toLowerCase() === "approved"}
                        title={
                          (apiDetails?.status || "").toLowerCase() === "approved"
                            ? "Approved quotations cannot be edited"
                            : undefined
                        }
                      >
                        {brandEditOpen[key] ? "Done" : "Edit"}
                      </Button>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="flex gap-2 mb-6">
                    <div className="text-sm text-gray-light flex items-center">
                      Sub:
                    </div>
                    {brandEditOpen[key] ? (
                      <input
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={edited.subject}
                        onChange={(e) =>
                          setBrandEdits((prev) => ({
                            ...prev,
                            [key]: {
                              ...(prev[key] || getBrandDefaults(key)),
                              subject: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-dark">
                        {edited.subject}
                      </div>
                    )}
                  </div>

                  {/* Introduction */}
                  <div className="text-sm text-gray-dark leading-relaxed">
                    {brandEditOpen[key] ? (
                      <textarea
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-28"
                        value={edited.intro}
                        onChange={(e) =>
                          setBrandEdits((prev) => ({
                            ...prev,
                            [key]: {
                              ...(prev[key] || getBrandDefaults(key)),
                              intro: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      edited.intro.split("\n").map((p, i) => (
                        <p key={i} className={i === 0 ? "mb-2" : ""}>
                          {p}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* Quotation Table */}
                <div className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Sl. No.
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Item Description
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Size in mm
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            HSN Code
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Qty.in Mtr./Nos.
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Rate Rs. Mtr./Nos.
                          </th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-dark">
                            Amount Rs.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, index: number) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {index + 1}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {item?.brand} {item?.category}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {item.size || "-"}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {item.hsn_code || "-"}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {(item.quantity || 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-gray-dark font-medium">
                              {formatCurrency(item.finalAmount || item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Amount */}
                  <div className="text-right space-y-2">
                    <div className="text-lg font-bold text-gray-dark border-x border-b border-gray-300 p-2">
                      Total Amount Rs.: {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="p-8 border-t border-gray-200">
                  <div className="max-w-[720px]">
                    <h3 className="text-lg font-semibold text-gray-dark mb-4">
                      Terms & Conditions:
                    </h3>
                    {brandEditOpen[key] ? (
                      <textarea
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-40"
                        value={edited.terms}
                        onChange={(e) =>
                          setBrandEdits((prev) => ({
                            ...prev,
                            [key]: {
                              ...(prev[key] || getBrandDefaults(key)),
                              terms: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-dark">
                        {edited.terms
                          .split("\n")
                          .filter(Boolean)
                          .map((line, i) => (
                            <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                          ))}
                      </ol>
                    )}
                  </div>
                  <div className="mt-4 ">
                    {brandEditOpen[key] ? (
                      <textarea
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20"
                        value={edited.note}
                        onChange={(e) =>
                          setBrandEdits((prev) => ({
                            ...prev,
                            [key]: {
                              ...(prev[key] || getBrandDefaults(key)),
                              note: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <p className="text-base text-gray-dark underline font-medium whitespace-pre-wrap">
                        {edited.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Closing */}
                <div className="px-8">
                  {brandEditOpen[key] ? (
                    <textarea
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-36"
                      value={edited.closing}
                      onChange={(e) =>
                        setBrandEdits((prev) => ({
                          ...prev,
                          [key]: {
                            ...(prev[key] || getBrandDefaults(key)),
                            closing: e.target.value,
                          },
                        }))
                      }
                    />
                  ) : (
                    <div className="text-base text-gray-dark leading-relaxed mb-6 font-medium whitespace-pre-wrap">
                      {edited.closing}
                      {assets.signature ? (
                        <div className="mt-2">
                          <img
                            src={assets.signature}
                            alt="Signature"
                            className="h-16 w-auto"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {showBranding && assets.qr ? (
                  <div className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="flex justify-center">
                        <img
                          src={assets.qr}
                          alt="QR Code"
                          className="w-24 h-24 mx-auto"
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-dark mb-1">
                          <strong>{brandDisplay}</strong>
                        </div>
                        {assets.displayName?.includes("NORPACK") ? (
                          <div className="text-xs text-gray-light space-y-0.5">
                            <div>
                              Corporate office: B-39, Sector-81, Phase-2,
                              Noida-201305, UP
                            </div>
                            <div>Tel: 0120-4523400</div>
                            <div>
                              Works: B-20 Phase-2, Noida-201305, UP
                            </div>
                            <div>
                              Tel: 0120-4277036/37. E-mail: info@norpack.in
                            </div>
                          </div>
                        ) : assets.displayName?.includes("AKG") ? (
                          <div className="text-xs text-gray-light space-y-0.5">
                            <div>
                              B-39, Sector-81, Phase-2, Noida-201305, U.P.
                            </div>
                            <div>Tel.: 0120-4523400</div>
                            <div>E-mail: sales@akgsteelind.com</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="bg-background-dark h-full flex flex-col relative">
      {/* Control Bar */}
      <div className={`bg-background-light border-t border-border-dark px-4 sm:px-6 lg:px-8 py-2 flex-shrink-0 relative z-10 transition-all duration-300 ${
        showAudit ? 'mr-[320px]' : ''
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            {(() => {
              const validBrands = Object.entries(
                (apiDetails as any)?.brands || {}
              ).filter(([key, brand]: any) => key && !isHiddenBrand(String(key)) && brand?.brand_name);

              if (validBrands.length <= 1) return null;

              return (
                <div className="">
                  <div className="flex flex-wrap gap-2 p-1 rounded-lg w-fit bg-background-lightest border border-border-dark">
                    {validBrands.map(([key]: any, index) => {
                      const assets = resolveBrandAssets(key);
                      const brandDisplay = assets.displayName || key;
                      return (
                        <div key={key} className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveBrandTab(key)}
                            className={`px-3 py-1.5 text-sm transition-colors ${
                              activeBrandTab === key
                                ? "bg-background-dark text-gray-dark font-medium rounded"
                                : "bg-transparent text-gray-light hover:bg-background-light"
                            } ${
                              index !== 0 ? "border-l border-border-dark" : ""
                            }`}
                          >
                            {brandDisplay}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const validBrands = Object.entries(
                (apiDetails as any)?.brands || {}
              ).filter(([key, brand]: any) => key && !isHiddenBrand(String(key)) && brand?.brand_name);

              if (validBrands.length > 1) {
                return (
                  <Button
                    variant="back"
                    onClick={() => handleDownloadBrand(activeBrandTab)}
                  >
                    <IconDownload className="w-4 h-5.5" />
                  </Button>
                );
              } else {
                const brandKey =
                  validBrands.length > 0 ? validBrands[0][0] : "";
                return (
                  <Button
                    variant="back"
                    onClick={() => handleDownloadBrand(brandKey)}
                  >
                    <IconDownload className="w-5 h-5.5" />
                  </Button>
                );
              }
            })()}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 py-1">
            <Button
              variant="close"
              onClick={handleZoomOut}
              title="Zoom Out (Ctrl/Cmd - -)"
              className="p-2 sm:p-3"
            >
              <IconZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleZoomReset}
              title="Reset Zoom (Ctrl/Cmd + 0)"
            >
              {zoomLevel}%
            </Button>
            <Button
              variant="close"
              onClick={handleZoomIn}
              title="Zoom In (Ctrl/Cmd + +)"
              className="p-2 sm:p-3"
            >
              <IconZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="close"
              onClick={handleZoomFit}
              title="Fit to Screen (Ctrl/Cmd + 1)"
              className="p-2 sm:p-3"
            >
              <IconMaximize className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="close"
              onClick={() => setShowAudit((v) => !v)}
              title="Toggle Audit Trail"
              className="p-2 sm:p-3"
              style={showAudit ? { backgroundColor: '#2e4828', color: 'white' } : {}}
            >
              <IconHistory className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

    {/* Main Content Area */}
    <div className="flex-1 flex relative overflow-hidden">
      {/* PDF Document Container */}
      <div className={`flex-1 transition-all duration-300 overflow-hidden ${
        showAudit ? 'mr-[320px]' : ''
      }`}>
        <div className="h-full overflow-auto sm:px-6 lg:px-8 pb-2 sm:pb-4 p-2 sm:p-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ minHeight: '100%', overflow: 'visible' }}>
            {renderPreviewContent()}
          </div>
        </div>
      </div>

    </div>

    {/* Audit Trail Slide-out Panel - Positioned beside button, below control bar */}
    <div
      className={`absolute top-0 right-0 h-full w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        showAudit ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <AuditPanel documentId={rfqId} onClose={() => setShowAudit(false)} />
    </div>
    </div>
  );
};

export default QuotePreviewPage;
