import type { ComponentType } from "react";

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface LoadingProps {
  message?: string;
  subMessage?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  tokens: Tokens;
  user: User;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirm_password: string;

}

export interface SignupResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    company_name: string;
  };
  company_assigned: boolean;
  company_assignment_method: string;
  is_admin: boolean;
  email_sent: boolean;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface VerifyInvitationResponse {
  success: boolean;
  valid: boolean;
  user_info: {
    name: string;
    email: string;
    job_title?: string;
    company_name: string;
    access_level: string;
    role_name: string;
  };
  expires_at: string;
}

export interface SetupPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface SetupPasswordResponse {
  success: boolean;
  message: string;
  tokens: Tokens;
  user: User;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  valid: boolean;
  tokens?: Tokens;
  user?: User;
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface VerifyResetTokenResponse {
  success: boolean;
  valid: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  email_sent: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  email_sent: boolean;
}

export interface CompanyInfoRequest {
  domain: string;
}

export interface CompanyInfoResponse {
  success: boolean;
  company_exists: boolean;
  company?: {
    id: number;
    name: string;
    domain: string;
    code: string;
  };
}

// Health check types
export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Environment types
export interface EnvironmentConfig {
  API_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

export interface HeaderProps {
  activeTab: string;
  isMobile: boolean;
  onMenuClick: () => void;
  onSearch?: (searchTerm: string) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  showSearch?: boolean;
  notificationCount?: number;
}

export interface SidebarProps {
  activeTab: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
}

export interface DashboardStats {
  openQuotes: { count: number; subtitle: string };
  openPurchaseOrders: { count: number; subtitle: string };
  openSalesOrders: { count: number; subtitle: string };
  outstandingInvoices: { amount: number; subtitle: string };
}

export interface TimeRangeOption {
  key: string;
  label: string;
}

export type StatCardVariant = "default" | "currency";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  icon?: ComponentType<{ className?: string }>;
  variant?: StatCardVariant;
  isLoading?: boolean;
}

export interface Activity {
  id: string;
  type: "Quote" | "PO" | "Sales Order" | "Invoice";
  description: string;
  status: "pending" | "completed" | "error" | "approved" | "draft" | string;
  timestamp: string;
}

export interface ActivityTableProps {
  activities: Activity[];
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export interface QuickActionsPanelProps {
  onButtonClick?: () => void;
}

export interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
  onClose?: () => void;
}

export interface Alert {
  id: string;
  type: "invoice_overdue" | "po_confirmation" | "payment_due" | "quote_delayed";
  title: string;
  description: string;
  date: string;
  action?: string;
}

export interface User {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  job_title?: string;
  bio?: string;
  phone?: string;
  profile_photo?: string | null;
  company?: number;
  company_name?: string;
  access_level?: string;
  is_admin?: boolean;
  is_active?: boolean;
  status?: string;
  last_login?: string | null | boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: any;
}

export type QuotationStatus = "draft" | "sent" | "approved" | "processed" ;

export interface Quote {
  id: string;
  rfqId: string;
  date: string;
  customer_info: {
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
  };
  amount: number;
  lastUpdate: string;
  status: QuotationStatus;
}

export interface QuotationItem {
  id: string;
  description: string;
  material_type?: string;
  size_specification?: string;
  category?: string;
  brand?: string;
  size: string;
  hsn_code?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
  discountRate?: number;
  discountAmount?: number;
  finalAmount?: number;
  matched?: boolean;
  line_no?: number;
  match_type?: boolean | null;
  reason?: string;
  item_code?: string;
  rate_per_meter?: number;
  display_price?: number;
  display_unit?: string;
  selection_source?: "selected" | "manual";
  options?: Array<{
    option_id: string;
    description: string;
    category: string;
    brand: string;
    size: string;
    hsn_code: string;
    unit_price_piece: number | null;
    unit_price_meter: number | null;
    lp?: number | null;
    match_reason: string;
  }>;
  recommended_option?: number | null;
  original_description?: string;
}

export interface Attachment {
  filename: string;
  size?: number;
  type: string;
  url?: string;
  id: string;
  preview?: string;

}

export interface RFQEmail {
  id: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  receivedDate: string;
  attachments?: Attachment[];
  rfqId: string;
}

export type EmailDetails = {
  subject: string;
  from: string;
  to: string[];
  receivedAt: string;
  bodyPreview?: string;
};

export interface Quotation {
  id: string;
  quote_id: string;
  reference_number: string;
  rfqId: string;
  date?: string;
  customer_info: {
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    customer_address: string | null;
  };
  amount: number;
  globalTaxRate?: number;
  globalDiscountRate?: number;
  lastUpdate: string;
  status: string;
  items: QuotationItem[];
  quoteId?: string;
  createdDate?: string;
  updatedDate?: string;
  sendToEmail?: string;
  to?: string;
  subject?: string;
  subtotal?: number;
  totalAmountDue?: number;
  norpackAkg?: string;
  originalRfq?: {
    from: string;
    subject: string;
    received: string;
    emailBody: string;
    attachments: string[];
  };
  email_details?: EmailDetails | null;
}

export interface QuotationFeedProps {
  onQuotationClick: (quotation: Quotation) => void;
  quotations?: Quotation[];
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onStatusFilterChange?: (status: string) => void;
  onSearchChange?: (query: string) => void;
  onRefreshClick?: () => void;
  refreshLabel?: string;
  isRefreshing?: boolean;
}

export interface QuotationTableProps {
  quotations: Quotation[];
  onSort: (field: string, direction: "asc" | "desc") => void;
}

export interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: QuotationItem) => void;
  item?: QuotationItem | null;
  title?: string;
}

export interface ItemFormData {
  description: string;
  category: string;
  size: string;
  quantity: number;
  unitPrice: number;
  brand?: string;
}

export interface ItemDescriptionTableProps {
  items: QuotationItem[];
  subtotal: number;
  totalAmountDue: number;
  onItemsChange: (items: QuotationItem[]) => void;
  readOnly?: boolean;
  globalTaxRate?: number;
  globalDiscountRate?: number;
  onGlobalTaxChange?: (rate: number) => void;
  onGlobalDiscountChange?: (rate: number) => void;
  onFinalizeSelections?: (selections: Record<string, string>) => Promise<boolean> | boolean | void;
  onSelectionsChange?: (selections: Record<string, string>) => void;
  resetSelectionsKey?: number;
}

export interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  onSave: (quotation: Quotation) => void;
}

export interface TimeRangeSelectorProps {
  buttonLabel?: string;
  onButtonClick?: () => void;
  onTimeRangeChange?: (params: TimeRangeParams) => void;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  job_title: string;
  bio: string;
  phone: string;
  profile_photo: string;
  access_level: "View Only" | "Edit Both" | "Edit Quotation";
  is_admin: boolean;
  is_active: boolean;
  status: "ACTIVE" | "PENDING" | "INACTIVE" | "SUSPENDED";
  last_login?: string | null | boolean;
  created_at: string;
  updated_at: string;
  company: {
    id: number;
    name: string;
    code: string | null;
    domain: string;
  };
  role: any;
  created_by?: {
    id: number | null;
    name: string;
    email: string;
  };
  invitation?: {
    expires_at: string;
    is_expired: boolean;
  };
}

export interface MembersResponse {
  success: boolean;
  count: number;
  users: Member[];
  company: {
    id: number;
    name: string;
  };
}

export const ACCESS_LEVELS = {
  view_only: "View Only",
  edit_both: "Edit Both",
  edit_quotation: "Edit Quotation",
} as const;

export interface CreateMemberRequest {
  email: string;
  name: string;
  job_title?: string;
  bio?: string;
  phone?: string;
  role_id?: number;
  access_level?: typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];
  is_admin?: boolean;
}

export interface CreateMemberResponse {
  success: boolean;
  message: string;
  member: Member;
}

export interface UpdateMemberRequest {
  name?: string;
  job_title?: string;
  bio?: string;
  phone?: string;
  role_id?: number;
  access_level?: typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];
  is_admin?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
}

export interface MembersQueryParams {
  status?: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  job_title?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Role {
  id: number;
  name: string;
}

export interface RolesResponse {
  success: boolean;
  roles: Role[];
}

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberData: CreateMemberRequest) => Promise<void>;
  onUpdate?: (memberId: number, memberData: UpdateMemberRequest) => Promise<void>;
  isLoading: boolean;
  member?: Member | null;
}

export interface ProfileFormData {
  name: string;
  email: string;
  bio: string;
  job_title: string;
  access_level: string;
  phone: string;
  profile_photo?: File | null;
}

export interface OriginalRFQProps {
  rfqEmail: RFQEmail | null;
  isLoading?: boolean;
}

export interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  onSave: (quotation: Quotation) => void;
  generateRFQId: () => string;
}

export interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  attachmentCount: number;
}

export interface AttachmentItemProps {
  attachment: Attachment;
  onPreview?: (attachment: Attachment) => void;
  onDownload?: (attachment: Attachment) => void;
  showInline?: boolean;
}

// Quotation Statistics Types
export interface MonthlyTrend {
  month: string;
  month_name: string;
  quotations: number;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
}

export interface ContentTypeBreakdown {
  content_type: string;
  count: number;
}

export interface DashboardTotals {
  total_quotations: number;
  active_quotations: number;
  processed_quotations: number;
  approved_quotations: number;
}

export interface DashboardStatistics {
  totals: DashboardTotals;
  monthly_trends: MonthlyTrend[];
  status_breakdown: StatusBreakdown[];
  content_type_breakdown: ContentTypeBreakdown[];
}

export interface PerformanceMetrics {
  average_match_rate: number;
  total_quotations: number;
  total_items_processed: number;
  successful_matches: number;
  match_success_rate: number;
}

export interface DashboardStatisticsResponse {
  success: boolean;
  dashboard: DashboardStatistics;
}

export interface PerformanceStatisticsResponse {
  success: boolean;
  performance: PerformanceMetrics;
}

export interface TimeRangeParams {
  start_date?: string;
  end_date?: string;
  time_range?: string;
}

// SKU Management Types
export interface SKUItem {
  id: number;
  brand: string;
  category: string;
  description: string;
  size: string;
  outer_diameter_mm?: number;
  inner_diameter_mm?: number;
  length_m?: number;
  packing_quantity: string;
  rate_per_meter?: number;
  rate_per_piece?: number;
  hsn_code: string;
  effective_date: string;
  width_mm?: string;
  height_mm?: number;
  dimension_cm?: string;
  weight: string;
  has_rate_meter: boolean;
  has_rate_piece: boolean;
  display_price: number;
  display_unit: string;
}

export interface SKUPagination {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SKUFilters {
  search: string;
  category: string;
  brand: string;
  min_price?: number;
  max_price?: number;
  has_meter_rate?: boolean;
  has_piece_rate?: boolean;
}

export interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
}

export interface SKUListResponse {
  success: boolean;
  data: {
    items: SKUItem[];
    pagination: SKUPagination;
    filters: SKUFilters;
    company_info: CompanyInfo;
  };
}

export interface SKUDetailsResponse {
  success: boolean;
  data: {
    item: SKUItem;
    company_info: CompanyInfo;
  };
}

export interface SKUCategoriesResponse {
  success: boolean;
  data: {
    categories: Array<{
      name: string;
      item_count: number;
      items_with_price: number;
    }>;
    total_categories: number;
    company_info: CompanyInfo;
  };
}

export interface SKUBrandsResponse {
  success: boolean;
  data: {
    brands: Array<{
      name: string;
      item_count: number;
      items_with_price: number;
    }>;
    total_brands: number;
    company_info: CompanyInfo;
  };
}

export interface SKUSearchResponse {
  success: boolean;
  data: {
    results: Array<{
      id: number;
      hsn_code: string;
      description: string;
      brand: string;
      category: string;
      rate_per_meter?: number;
      display_price: number;
      display_unit: string;
    }>;
    count: number;
    search_params: {
      search: string;
      category: string;
      brand: string;
    };
    company_info: CompanyInfo;
  };
}

export interface SKUStatsResponse {
  success: boolean;
  data: {
    statistics: {
      price_distribution: Record<string, number>;
      top_categories: Array<{
        name: string;
        count: number;
      }>;
      top_brands: Array<{
        name: string;
        count: number;
      }>;
    };
    company_info: CompanyInfo;
  };
}

export interface SKUQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  has_meter_rate?: boolean;
  has_piece_rate?: boolean;
}

// Updated Quotation Types for new API
export interface QuotationLineItem {
  line_no: number;
  description: string;
  material_type?: string;
  size_specification?: string;
  quantity: number;
  unit: string;
  notes?: string;
  unit_price: number;
  total_price: number;
  original_description: string;
  matched: boolean;
  hsn_code: string;
  matched_description?: string;
  brand?: string;
  category?: string;
  amount: number;
  match_score: number;
  reason: string;
  match_type: boolean | null;
  options: Array<{
    option_id: string;
    description: string;
    category: string;
    brand: string;
    size: string;
    hsn_code: string;
    unit_price_piece: number | null;
    unit_price_meter: number | null;
    lp?: number | null;
    match_reason: string;
  }>;
  recommended_option: number | null;
  size: string;
}

export interface QuotationTotals {
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  discount_rate: number;
  discount_amount: number;
  subtotal_after_discount: number;
}

export interface QuotationDetailsResponse {
  success: boolean;
  quote_id: string;
  reference_number: string;
  status: string;
  total_amount: number;
  currency: string;
  brands: Record<string, {
    brand_name: string;
    line_items: Array<{
      unit: string;
      line_no: number;
      options: Array<{
        size: string;
        brand: string;
        category: string;
        hsn_code: string;
        option_id: string;
        description?: string;
        match_reason: string;
        unit_price_meter: number | null;
        unit_price_piece: number | null;
        lp?: number | null;
        unit?: string;
      }>;
      quantity: number;
      reasoning: string;
      match_type: boolean | null;
      description?: string;
      material_type: string;
      recommended_option: number | null;
      size_specification: string;
      unit_price?: number;
      amount?: number;
      selected_option?: string;
    }>;
    totals: {
      subtotal: number;
      tax_amount: number;
      total_amount: number;
      currency: string;
    };
  }>;
  customer_info: {
    customer_email?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
  };
  overall_totals: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount_amount: number;
    discount_rate: number;
    total_amount: number;
    currency: string;
  };
  match_rate: number;
  attachments: Array<{
    id: number;
    original_filename: string;
    file_size: number;
    content_type: string;
    presigned_url: string;
    is_processed: boolean;
  }>;
  attachments_count: number;
  company_name: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  rfq_id: string;
  rfq_status: string;
  email_details?: EmailDetails | null;
}

export interface QuotationListItem {
  quote_id: string;
  reference_number: string;
  company_name: string;
  status: string;
  content_type: string;
  created_at: string;
  customer_info: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
  };
  expires_at: string;
  is_expired: boolean;
  total_amount: number;
  items_count: number;
  match_rate: number;
  rfq_preview: string;
  rfq_id?: number;
  updated_at?: string;
}

export interface QuotationListResponse {
  success: boolean;
  data: {
    quotations: QuotationListItem[];
    pagination: SKUPagination;
    filters: {
      status: string;
      content_type: string;
      from_date: string;
      to_date: string;
    };
    company_info: CompanyInfo;
  };
}

export interface ProcessRFQResponse {
  success: boolean;
  quotation: {
    quote_id: string;
    company_name: string;
    company_slug: string;
    rfq_text: string;
    content_type: string;
    processed_line_items: QuotationLineItem[];
    pricing_totals: QuotationTotals;
    total_amount: string;
    status: string;
    match_rate: number;
    is_expired: boolean;
    items_count: number;
    created_at: string;
    updated_at: string;
    expires_at: string;
    company: {
      id: number;
      name: string;
      slug: string;
    };
    rfq_details: {
      content_type: string;
      rfq_text: string;
    };
    line_items: QuotationLineItem[];
    totals: QuotationTotals;
    summary: {
      total_items: number;
      match_rate: number;
      total_amount: number;
    };
  };
}

export interface QuotationUpdateRequest {
  status?: string;
  [key: string]: any;
}

export interface QuotationUpdateResponse {
  success: boolean;
  message: string;
  quotation: {
    quote_id: string;
    status: string;
  };
}

// Manual Quotation Payload Types
export interface ManualQuotationSKUItem {
  item_code?: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  rate_per_piece?: number;
  rate_per_meter?: number;
  hsn_code?: number | string;
  unit?: string;
  display_price?: number;
  display_unit?: string;
  has_rate_piece?: boolean;
  has_rate_meter?: boolean;
}

export interface ManualQuotationSelectedItem {

  sku_item?: ManualQuotationSKUItem;
  id?: string | null;
  item_code?: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  rate_per_piece?: number;
  rate_per_meter?: number;
  display_price?: number;
  display_unit?: string;
  hsn_code?: number | string;
  has_rate_piece?: boolean;
  has_rate_meter?: boolean;
  unit?: string;
  // common
  quantity: number;
}


export interface ManualQuotationAttachment {
  filename: string;
  content: string;
  content_type: string;
}

export interface ManualQuotationPayload {
  sku_items: ManualQuotationSelectedItem[];
  company_slug: string;
  attachments: ManualQuotationAttachment[];
}

interface PriceMasterItemBase {
  id: number;
  sl_no: number | null;
  hsn_code: string | null;
  lp: string | null;
  effective_date: string | null;
  unit: string | null;
  brand_make: string | null;
  item_description: string | null;
  sizes: string | null;
  // Stellaris-specific fields
  variant_number?: string | null;
  inventory_unit?: string | null;
  configuration?: string | null;
  color_name?: string | null;
  style?: string | null;
  net_weight?: string | null;
  line_of_business?: string | null;
  colour?: string | null;
  size?: string | null;
}

export interface PriceMasterItem extends PriceMasterItemBase {}

export interface PriceMasterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PriceMasterItem[];
}

export interface PriceMasterDetailsResponse extends PriceMasterItemBase {}

export type PriceMasterCreatePayload = {
  [key: string]: string | number | boolean | null | undefined;
};

export type PriceMasterCreateResponse = {
  id: number;
} & Record<string, any>;

export type PriceMasterCategoriesResponse = string[];

export type PriceMasterBrandsResponse = string[];

export interface PriceMasterUpdateItemRequest {
  id: number;
  field: string;
  value: string | number | boolean;
}

export interface PriceMasterUpdateItemResponse extends PriceMasterItemBase {}

export interface PriceMasterBulkUpdateRequest {
  id: number;
  field: string;
  value: string | number | boolean;
}

export interface PriceMasterBulkUpdateResponse {
  success: Array<{
    item_id: number;
    field: string;
    value: string | number | boolean;
  }>;
  errors: Array<{
    item_id: number;
    field: string;
    error: string;
  }>;
}

export interface PriceMasterQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  ordering?: string;
}

export interface RawMaterialItem {
  id: number;
  grade: string;
  price: string;
  date_time: string;
  item_description?: string;
}

export interface RawMaterialPagination {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface RawMaterialFilters {
  search: string;
  grade?: string;
  price_min?: number;
  price_max?: number;
}

export interface RawMaterialListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawMaterialItem[];
}

export interface RawMaterialDetailsResponse {
  id: number;
  grade: string;
  price: string;
  date_time: string;
  item_description?: string;
}

export interface RawMaterialCreatePayload {
  grade: string;
  price: number;
  date_time?: string;
  item_description?: string;
}

export interface RawMaterialUpdatePayload {
  grade?: string;
  price?: number;
  date_time?: string;
  item_description?: string;
}

export interface RawMaterialSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawMaterialItem[];
}

export interface RawMaterialFilterPayload {
  grade?: string;
  price?: string;
  date_time?: string;
}

export interface RawMaterialUpdateItemRequest {
  id: number;
  field: string;
  value: string | number;
}

export interface RawMaterialUpdateItemResponse {
  id: number;
  grade: string;
  price: string;
  date_time: string;
  item_description?: string;
}

export interface RawMaterialBulkUpdateRequest {
  id: number;
  field: string;
  value: string | number;
}

export interface RawMaterialBulkUpdateResponse {
  success: number;
  errors: number;
  message: string;
}

export interface RawMaterialQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  grade?: string;
  price_min?: number;
  price_max?: number;
}