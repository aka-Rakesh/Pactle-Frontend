import React, { useState, useCallback, useEffect } from "react";
import {
  IconMail,
  IconFileText,
  IconFile,
  IconDownload,
  IconMaximize,
  IconFileSpreadsheet,
  IconFileWord,
} from "@tabler/icons-react";
import type { AttachmentItemProps, OriginalRFQProps, TabProps, QuotationDetailsResponse, RFQEmail } from "../../types/common";
import { API_CONFIG, API_ENDPOINTS, getAuthHeaders } from "../../api/config";
import { getCookie, COOKIE_KEYS } from "../../stores/authStore";

const FILE_TYPE_CONFIG = {
  pdf: {
    icon: IconFile,
    color: "text-pink-dark",
    bgColor: "bg-pink-lightest",
    canPreview: true,
  },
  doc: {
    icon: IconFileWord,
    color: "text-blue-darkest",
    bgColor: "bg-blue-50",
    canPreview: false,
  },
  docx: {
    icon: IconFileWord,
    color: "text-blue-darkest",
    bgColor: "bg-blue-50",
    canPreview: false,
  },
  csv: {
    icon: IconFileSpreadsheet,
    color: "text-green-dark",
    bgColor: "bg-green-lightest",
    canPreview: true,
  },
  txt: {
    icon: IconFileText,
    color: "text-gray-dark",
    bgColor: "bg-gray-light",
    canPreview: true,
  },
  default: {
    icon: IconFile,
    color: "text-gray-dark",
    bgColor: "bg-gray-light",
    canPreview: false,
  },
};

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

const getFileTypeConfig = (filename: string) => {
  const extension = getFileExtension(filename);
  return (
    FILE_TYPE_CONFIG[extension as keyof typeof FILE_TYPE_CONFIG] ||
    FILE_TYPE_CONFIG.default
  );
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const TabNavigation: React.FC<TabProps> = ({
  activeTab,
  onTabChange,
  attachmentCount,
}) => (
  <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-lg w-fit bg-background-lightest divide-background-dark border border-border-dark">
    <button
      onClick={() => onTabChange("email")}
      className={`px-3 py-1.5 text-sm rounded transition-colors ${
        activeTab === "email"
          ? "bg-background-dark text-gray-dark font-medium"
          : "bg-transparent text-gray-light hover:bg-background-light"
      }`}
    >
      Email Body
    </button>
    {attachmentCount > 0 && (
      <button
        onClick={() => onTabChange("attachments")}
        className={`px-3 py-1.5 text-sm rounded transition-colors ${
          activeTab === "attachments"
            ? "bg-background-dark text-gray-dark font-medium"
            : "bg-transparent text-gray-light hover:bg-background-light"
        }`}
      >
        {attachmentCount > 1 ? `Attachments (${attachmentCount})` : attachmentCount === 1 ? `Attachment (${attachmentCount})` : `Attachments`}
      </button>
    )}
  </div>
);

const AttachmentItem: React.FC<AttachmentItemProps> = ({
  attachment,
  onPreview,
  onDownload,
  showInline = false,
}) => {
  const fileConfig = getFileTypeConfig(attachment.filename);
  const IconComponent = fileConfig.icon;

  const handlePreviewClick = useCallback(() => {
    if (onPreview) {
      onPreview(attachment);
      return;
    }
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  }, [attachment, onPreview]);

  const handleDownloadClick = useCallback(() => {
    if (onDownload) {
      onDownload(attachment);
      return;
    }
  }, [attachment, onDownload]);

  if (showInline) {
    return (
      <button
        onClick={() => onPreview && onPreview(attachment)}
        className={`px-3 py-1.5 text-sm rounded transition-colors bg-gray-100 text-gray-dark hover:bg-gray-200`}
      >
        {attachment.filename}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-border-dark rounded-lg hover:bg-gray-50 transition-colors group">
      <div className={`p-2 rounded ${fileConfig.bgColor}`}>
        <IconComponent className={`w-4 h-4 ${fileConfig.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-dark truncate">
          {attachment.filename}
        </p>
        {attachment.size && (
          <p className="text-xs text-gray-light">
            {formatFileSize(attachment.size)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {fileConfig.canPreview && (
          <button
            onClick={handlePreviewClick}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Preview"
          >
            <IconMaximize className="w-4 h-4 text-gray-light" />
          </button>
        )}

        <button
          onClick={handleDownloadClick}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Download"
        >
          <IconDownload className="w-4 h-4 text-gray-light" />
        </button>
      </div>
    </div>
  );
};

interface EnhancedOriginalRFQProps extends Omit<OriginalRFQProps, 'rfqEmail'> {
  rfqEmail?: RFQEmail | null;
  apiData?: QuotationDetailsResponse | null;
  isLoading?: boolean;
}

const OriginalRFQ: React.FC<EnhancedOriginalRFQProps> = ({ rfqEmail, apiData, isLoading }) => {
  const [activeTab, setActiveTab] = useState<"email" | "attachments">("email");
  const [rfqLoading] = useState<boolean>(false);

  useEffect(() => {
  }, [apiData?.quote_id]);

  const handleAttachmentDownload = useCallback(async (att: any) => {
    try {
      const quoteId = apiData?.quote_id;
      const attachmentId = att.id || att.attachment_id;
      if (!quoteId || !attachmentId) return;
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUOTATIONS.DOWNLOAD(String(quoteId), String(attachmentId))}`;
      const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN) || "";
      const res = await fetch(url, { method: 'GET', headers: getAuthHeaders(token) });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd || '');
      const suggested = decodeURIComponent((match && (match[1] || match[2])) || '') || att.filename || 'attachment';
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error('Attachment download error', err);
    }
  }, [apiData?.quote_id]);

  if (isLoading || rfqLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Use API data if available, otherwise fall back to RFQ email
  const hasApiData = Boolean(apiData);
  const hasRfqEmail = rfqEmail;
  
  if (!hasApiData && !hasRfqEmail) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center py-8">
          <IconMail className="w-8 h-8 text-gray-light mx-auto mb-2" />
          <p className="text-sm text-gray-light">No RFQ data available</p>
        </div>
      </div>
    );
  }

  // Determine attachments and content based on available data
  let attachmentCount = 0;
  let attachments: any[] = [];
  let emailContent = "";
  let fromEmail = "";
  let subject = "";
  let receivedDate = "";

  if (hasApiData) {
    try {
      if (apiData?.attachments && apiData.attachments.length > 0) {
        const uniqueAttachments = apiData.attachments.filter((attachment, index, self) => 
          index === self.findIndex(a => a.id === attachment.id)
        );
        
        attachments = uniqueAttachments.map((attachment, idx) => ({
          id: attachment.id?.toString() || idx.toString(),
          filename: attachment.original_filename || 'Unknown file',
          size: attachment.file_size || 0,
          type: attachment.content_type || 'application/octet-stream',
          url: attachment.presigned_url || '',
        }));
        attachmentCount = attachments.length;
      } else {
        attachmentCount = 0;
        attachments = [];
      }
    } catch (error) {
      console.error('Error processing attachments:', error);
      attachmentCount = 0;
      attachments = [];
    }
    
    const emailMeta: any = (apiData as any)?.email_details;
    if (emailMeta) {
      emailContent = "RFQ content processed and matched with products. See attachments for original documents.";
      fromEmail = emailMeta.from || apiData?.company_name || "";
      subject = emailMeta.subject || `Quote ${apiData?.quote_id || ""}`;
      const dateStr = emailMeta.receivedAt || apiData?.created_at;
      receivedDate = new Date(dateStr || new Date().toISOString()).toLocaleDateString();
    } else {
      emailContent = "RFQ content processed and matched with products. See attachments for original documents.";
      fromEmail = apiData?.company_name || "";
      subject = `Quote ${apiData?.quote_id || ""}`;
      const dateStr = apiData?.created_at;
      receivedDate = new Date(dateStr || new Date().toISOString()).toLocaleDateString();
    }
  } else if (hasRfqEmail) {
    attachmentCount = rfqEmail.attachments?.length || 0;
    attachments = rfqEmail.attachments || [];
    emailContent = rfqEmail.body;
    fromEmail = rfqEmail.from;
    subject = rfqEmail.subject;
    receivedDate = rfqEmail.receivedDate;
  }

  return (
    <>
      <div className="bg-background-light rounded-lg p-4 border border-border-dark">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">            
            <div className="space-y-2 text-xs">
              <div className="flex gap-1">
                <span className="text-gray-light">From:</span>
                <span className="text-gray-dark break-words">{fromEmail}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-light">Subject:</span>
                <span className="text-gray-dark break-words">{subject}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-gray-light">Received:</span>
                <span className="text-gray-dark">{receivedDate}</span>
              </div>
            </div>
          </div>
          
          <button className="p-1 hover:bg-background-dark rounded">
            <IconMaximize className="w-4 h-4 text-gray-light" />
          </button>
        </div>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as "email" | "attachments")}
          attachmentCount={attachmentCount}
        />

        <div className="min-h-[200px]">
          {activeTab === "email" && (
            <div className="bg-white rounded p-4 text-sm text-gray-light leading-relaxed max-h-60 overflow-y-auto border border-border-dark">
              <div className="whitespace-pre-wrap">{emailContent}</div>
            </div>
          )}

          {activeTab === "attachments" && attachmentCount > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {attachments.map((attachment, index) => {
                try {
                  return (
                    <AttachmentItem
                      key={attachment.id || attachment.attachment_id || index}
                      attachment={{
                        id: attachment.id || attachment.attachment_id?.toString() || index.toString(),
                        filename: attachment.filename || 'Unknown file',
                        size: attachment.size || 0,
                        type: attachment.content_type || attachment.type || 'application/octet-stream',
                        url: attachment.url || '',
                      }}
                      onDownload={handleAttachmentDownload}
                    />
                  );
                } catch (error) {
                  console.error('Error rendering attachment:', error, attachment);
                  return (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">Error loading attachment</p>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {activeTab === "attachments" && attachmentCount === 0 && (
            <div className="text-center py-8">
              <IconFile className="w-8 h-8 text-gray-light mx-auto mb-2" />
              <p className="text-sm text-gray-light">No attachments found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export { OriginalRFQ };
export default OriginalRFQ;