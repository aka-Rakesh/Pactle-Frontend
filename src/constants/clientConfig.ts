/**
 * Client Configuration System
 *
 * This file centralizes all client-specific configurations and feature flags.
 * Instead of hardcoding client checks in components, we define visibility rules
 * and feature flags here that can be controlled by environment variables or
 * account settings.
 */

export interface ClientConfig {
  // Brand/Client identification
  clientId: string;
  displayName: string;

  roles: Array<{
    id: string;
    name: string;
    color: string;
    access: string;
  }>;

  permissions: {
    pages: Record<string, string[]>; // pageKey -> allowed role ids or special flags
    actions: Record<string, string[]>; // actionKey -> allowed role ids or special flags
  };

  // UI Feature Flags
  features: {
    // Navigation & Layout
    showSidebar: boolean;
    showHeader: boolean;
    showSearch: boolean;
    showNotifications: boolean;

    // Dashboard Features
    showQuotations: boolean;
    showRawMaterials: boolean;
    showSkuList: boolean;
    showMembers: boolean;
    showProfile: boolean;

    // Quotation Features
    showQuotePreview: boolean;
    showQuoteExport: boolean;
    showQuoteEmail: boolean;
    showQuotePdf: boolean;

    // Admin Features
    showAdminPanel: boolean;
    showUserManagement: boolean;
    showSettings: boolean;
    showHelpSupport: boolean;
  };

  // Brand-specific assets and styling
  branding: {
    logo: string;
    favicon: string;
    companyName: string;
    supportEmail: string;
    brands: {
      [key: string]: {
        logo: string;
        qr: string;
        signature: string;
        displayName: string;
        closingLine: string;
      };
    };
  };

  // Business logic configurations
  business: {
    defaultCurrency: string;
    taxRate: number;
    paymentTerms: string;
    deliveryTerms: string;
    validityDays: number;
    terms: string;
    note: string;
    contact: string;
  };

  // Brand filtering configuration
  brands: {
    // Whether to show only client-specific brands or all brands
    showOnlyClientBrands: boolean;
    // Specific brands to show (if showOnlyClientBrands is true)
    allowedBrands: string[];
    // Default brand to select
    defaultBrand: string;
  };
}

// Default configuration - can be overridden by environment variables
const DEFAULT_CONFIG: ClientConfig = {
  clientId: "default",
  displayName: "Pactle",

  roles: [
      { id: "super_admin", name: "Super Admin", color: "bg-pink-dark", access: "View, comment, approve" },
      { id: "admin", name: "Admin", color: "bg-orange-darkest", access: "View, comment, approve" },
      { id: "salesperson", name: "Sales person", color: "bg-yellow-default", access: "View, comment, edit" },
      { id: "rm_manager", name: "RM Manager", color: "bg-blue-darkest", access: "Edit RM sheet" },
  ],

  permissions: {
    pages: {
      dashboard_overview: ["authenticated"],
      quotations_details: ["authenticated"],
      quotations_preview: ["authenticated"],
      profile: ["authenticated"],
      members: ["super_admin", "admin"],
      sku_list: ["super_admin", "admin", "salesperson"],
      raw_material_sheet: ["super_admin", "admin", "rm_manager"],
      help_support: ["authenticated"],
    },
    actions: {
      "quotations.create": ["super_admin", "admin", "salesperson"],
      "quotations.edit": ["super_admin", "admin", "salesperson"],
      "quotations.delete": ["super_admin", "admin"],
      "quotations.export": ["super_admin", "admin", "salesperson"],
      "quotations.email": ["super_admin", "admin", "salesperson"],
      "quotations.pdf": ["super_admin", "admin", "salesperson"],

      "members.create": ["super_admin", "admin"],
      "members.update": ["super_admin", "admin"],
      "members.activate": ["super_admin", "admin"],
      "members.deactivate": ["super_admin", "admin"],
      "members.modify_super_admin": ["super_admin"],

      "raw_materials.edit": ["super_admin", "admin", "rm_manager"],
      "sku.edit": ["super_admin", "admin", "salesperson"],
    },
  },

  features: {
    showSidebar: true,
    showHeader: true,
    showSearch: true,
    showNotifications: true,
    showQuotations: true,
    showRawMaterials: true,
    showSkuList: true,
    showMembers: true,
    showProfile: true,
    showQuotePreview: true,
    showQuoteExport: true,
    showQuoteEmail: true,
    showQuotePdf: true,
    showAdminPanel: true,
    showUserManagement: true,
    showSettings: true,
    showHelpSupport: true,
  },

  branding: {
    logo: "/logo.svg",
    favicon: "/favicon.ico",
    companyName: "Pactle",
    supportEmail: "support@pactle.com",
    brands: {
      default: {
        logo: "",
        qr: "",
        signature: "/Signature.jpg",
        displayName: "Pactle",
        closingLine: "",
      },
    },
  },

  business: {
    defaultCurrency: "INR",
    taxRate: 18,
    paymentTerms: "30 days",
    deliveryTerms: "As per schedule",
    validityDays: 7,
    terms: "Standard terms and conditions apply.",
    note: "For any further clarification please contact us.",
    contact: "Contact information not available.",
  },

  brands: {
    showOnlyClientBrands: false,
    allowedBrands: ["Norpack", "AKG"],
    defaultBrand: "Norpack",
  },
};

// Client-specific configurations
const CLIENT_CONFIGS: Record<string, Partial<ClientConfig>> = {
  akg: {
    clientId: "akg",
    displayName: "AKG Steel Industries",

    roles: [
      { id: "super_admin", name: "Super Admin", color: "bg-pink-dark", access: "View, comment, approve" },
      { id: "salesperson", name: "Sales person", color: "bg-yellow-default", access: "View, comment, edit" },
    ],

    permissions: {
      pages: {
        dashboard_overview: ["authenticated"],
        quotations_details: ["authenticated"],
        quotations_preview: ["authenticated"],
        profile: ["authenticated"],
        members: ["super_admin"],
        sku_list: ["super_admin", "salesperson"],
        help_support: ["authenticated"],
      },
      actions: {
        "quotations.create": ["super_admin", "salesperson"],
        "quotations.edit": ["super_admin", "salesperson"],
        "quotations.delete": ["super_admin"],
        "quotations.export": ["super_admin", "salesperson"],
        "quotations.email": ["super_admin", "salesperson"],
        "quotations.pdf": ["super_admin", "salesperson"],

        "members.create": ["super_admin"],
        "members.update": ["super_admin"],
        "members.activate": ["super_admin"],
        "members.deactivate": ["super_admin"],
        "members.modify_super_admin": ["super_admin"],
      },
    },

    features: {
      showSidebar: false,
      showHeader: true,
      showSearch: true,
      showNotifications: true,
      showQuotations: true,
      showRawMaterials: false,
      showSkuList: true,
      showMembers: true,
      showProfile: true,
      showQuotePreview: true,
      showQuoteExport: true,
      showQuoteEmail: true,
      showQuotePdf: true,
      showAdminPanel: true,
      showUserManagement: true,
      showSettings: true,
      showHelpSupport: true,
    },

    branding: {
      logo: "/AKG-logo.jpg",
      favicon: "/favicon.ico",
      companyName: "AKG Steel Industries",
      supportEmail: "sales@akgsteelind.com",
      brands: {
        AKG: {
          logo: "/AKG-logo.jpg",
          qr: "/akg-qr.png",
          signature: "/Signature.jpg",
          displayName: "AKG STEEL INDUSTRIES",
          closingLine: "For-AKG Steel Industries",
        },
      },
    },

    business: {
      defaultCurrency: "INR",
      taxRate: 18,
      paymentTerms: "45 days MSME Vendor",
      deliveryTerms: "As per your schedule",
      validityDays: 7,
      terms: `1. Taxes: GST @18% shall be charged extra.\n2. Payment Term: 45 days MSME Vendor\n3. Freight: Extra as per Actual.\n4. Delivery: As per your schedule.\n5. Conduit Packing: We supply the material in Standerd Lenth of 3 Meters, However we may supply approx 5% to 10% of the total quantity in non standard length ranging between 2.45 mtr. (8') & 3 mtr. (10').\n6. Dimensions: All dimensions of the Rigid MS/GI Conduits will be as per IS:9537 (Part-II/1981) with tolerance thereon.\n7. Validity: Our rates are valid for 7 days only from the date of this offer\n8. Insurance: if required charges will be in your Account.`,
      note: `Note: For any further clarification you are kindly requested to please communicate at our official E-mail Id sales@akgsteelind.com.`,
      contact: `Mukesh Kumar\nSr. Sales Manager\n(M)+91-8860882668`,
    },

    brands: {
      showOnlyClientBrands: true,
      allowedBrands: ["AKG"],
      defaultBrand: "AKG",
    },
  },

  norpack: {
    clientId: "norpack",
    displayName: "Norpack Industries",

    roles: [
      { id: "super_admin", name: "Super Admin", color: "bg-pink-dark", access: "View, comment, approve" },
      { id: "salesperson", name: "Sales person", color: "bg-yellow-default", access: "View, comment, edit" },
    ],

    // Tailored permissions to match Norpack roles
    permissions: {
      pages: {
        dashboard_overview: ["authenticated"],
        quotations_details: ["authenticated"],
        quotations_preview: ["authenticated"],
        profile: ["authenticated"],
        members: ["super_admin"],
        sku_list: ["super_admin", "salesperson"],
        help_support: ["authenticated"],
      },
      actions: {
        "quotations.create": ["super_admin", "salesperson"],
        "quotations.edit": ["super_admin", "salesperson"],
        "quotations.delete": ["super_admin"],
        "quotations.export": ["super_admin", "salesperson"],
        "quotations.email": ["super_admin", "salesperson"],
        "quotations.pdf": ["super_admin", "salesperson"],

        "members.create": ["super_admin"],
        "members.update": ["super_admin"],
        "members.activate": ["super_admin"],
        "members.deactivate": ["super_admin"],
        "members.modify_super_admin": ["super_admin"],
      },
    },

    features: {
      showSidebar: false,
      showHeader: true,
      showSearch: true,
      showNotifications: true,
      showQuotations: true,
      showRawMaterials: false,
      showSkuList: true,
      showMembers: true,
      showProfile: true,
      showQuotePreview: true,
      showQuoteExport: true,
      showQuoteEmail: true,
      showQuotePdf: true,
      showAdminPanel: true,
      showUserManagement: true,
      showSettings: true,
      showHelpSupport: true,
    },

    branding: {
      logo: "/norpack-logo.png",
      favicon: "/favicon.ico",
      companyName: "Norpack Industries",
      supportEmail: "info@norpack.in",
      brands: {
        NORPACK: {
          logo: "/norpack-logo.png",
          qr: "/norpack-qrcode.jpeg",
          signature: "/Signature.jpg",
          displayName: "NORPACK INDUSTRIES",
          closingLine: "For-Norpack Industries.",
        },
      },
    },

    business: {
      defaultCurrency: "INR",
      taxRate: 18,
      paymentTerms: "100% advance against Proforma Invoice",
      deliveryTerms: "As per mutually agreed schedule",
      validityDays: 15,
      terms: `1. Taxes: GST as applicable will be charged extra.\n2. Payment Terms: 100% advance against Proforma Invoice.\n3. Freight: Extra on actuals.\n4. Delivery: As per mutually agreed schedule.\n5. Quality: Supply as per agreed specifications and standards.\n6. Insurance: If required, to be borne by the buyer.\n7. Validity: Our rates are valid for 15 days from the date of this offer.`,
      note: `Note: For any further clarification please write to info@norpack.in.`,
      contact: `Arun Kumar Sharma\n(AGM Sales)\n(M)+91-88003 68579`,
    },

    brands: {
      showOnlyClientBrands: true,
      allowedBrands: ["NORPACK"],
      defaultBrand: "NORPACK",
    },
  },

  stellaris: {
    clientId: "stellaris",
    displayName: "Stellaris",

    roles: [
      { id: "super_admin", name: "Super Admin", color: "bg-pink-dark", access: "View, comment, approve" },
      { id: "admin", name: "Admin", color: "bg-orange-darkest", access: "View, comment, approve" },
      { id: "salesperson", name: "Sales person", color: "bg-yellow-default", access: "View, comment, edit" },
      { id: "rm_manager", name: "RM Manager", color: "bg-blue-darkest", access: "Edit RM sheet" },
    ],

    permissions: {
      pages: {
        dashboard_overview: ["authenticated"],
        quotations_details: ["authenticated"],
        quotations_preview: ["authenticated"],
        profile: ["authenticated"],
        members: ["super_admin", "admin"],
        sku_list: ["super_admin", "admin", "salesperson"],
        raw_material_sheet: ["super_admin", "admin", "rm_manager"],
        help_support: ["authenticated"],
      },
      actions: {
        "quotations.create": ["super_admin", "admin", "salesperson"],
        "quotations.edit": ["super_admin", "admin", "salesperson"],
        "quotations.delete": ["super_admin", "admin"],
        "quotations.export": ["super_admin", "admin", "salesperson"],
        "quotations.email": ["super_admin", "admin", "salesperson"],
        "quotations.pdf": ["super_admin", "admin", "salesperson"],

        "members.create": ["super_admin", "admin"],
        "members.update": ["super_admin", "admin"],
        "members.activate": ["super_admin", "admin"],
        "members.deactivate": ["super_admin", "admin"],
        "members.modify_super_admin": ["super_admin"],

        "raw_materials.edit": ["super_admin", "admin", "rm_manager"],
        "sku.edit": ["super_admin", "admin", "salesperson"],
      },
    },

    features: {
      showSidebar: true,
      showHeader: true,
      showSearch: true,
      showNotifications: true,
      showQuotations: true,
      showRawMaterials: true,
      showSkuList: true,
      showMembers: true,
      showProfile: true,
      showQuotePreview: true,
      showQuoteExport: true,
      showQuoteEmail: true,
      showQuotePdf: true,
      showAdminPanel: true,
      showUserManagement: true,
      showSettings: true,
      showHelpSupport: true,
    },

    branding: {
      logo: "/logo.svg",
      favicon: "/favicon.ico",
      companyName: "Stellaris",
      supportEmail: "support@stellaris.com",
      brands: {
        STELLARIS: {
          logo: "/logo.svg",
          qr: "",
          signature: "/Signature.jpg",
          displayName: "STELLARIS",
          closingLine: "For-Stellaris",
        },
      },
    },

    business: {
      defaultCurrency: "INR",
      taxRate: 18,
      paymentTerms: "30 days",
      deliveryTerms: "As per schedule",
      validityDays: 10,
      terms: "Standard terms and conditions apply for Stellaris products.",
      note: "Note: For any further clarification please contact support@stellaris.com.",
      contact: "Stellaris Support Team\nEmail: support@stellaris.com",
    },

    brands: {
      showOnlyClientBrands: true,
      allowedBrands: ["STELLARIS"],
      defaultBrand: "STELLARIS",
    },
  },
};

/**
 * Get client configuration with a specific client ID
 */
export function getClientConfigWithClientId(clientId: string): ClientConfig {
  const clientConfig = CLIENT_CONFIGS[clientId];

  if (!clientConfig) {
    console.warn(
      `Client configuration not found for: ${clientId}. Using default.`
    );
    return DEFAULT_CONFIG;
  }

  // Merge with default config to ensure all properties are present
  return {
    ...DEFAULT_CONFIG,
    ...clientConfig,
    features: {
      ...DEFAULT_CONFIG.features,
      ...clientConfig.features,
    },
    branding: {
      ...DEFAULT_CONFIG.branding,
      ...clientConfig.branding,
    },
    business: {
      ...DEFAULT_CONFIG.business,
      ...clientConfig.business,
    },
    brands: {
      ...DEFAULT_CONFIG.brands,
      ...clientConfig.brands,
    },
  };
}

/**
 * Get client configuration based on environment or user data
 */
export function getClientConfig(): ClientConfig {
  const clientId =
    import.meta.env.VITE_CLIENT_ID || getClientIdFromUser() || "default";

  return getClientConfigWithClientId(clientId);
}

/**
 * Get client ID from user data (company name)
 */
function getClientIdFromUser(): string | null {
  // This would typically come from your auth store or user context
  // For now, we'll use a simple check
  if (typeof window !== "undefined") {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const companyName = user?.company_name?.toLowerCase();

        if (companyName?.includes("akg")) return "akg";
        if (companyName?.includes("norpack")) return "norpack";
        if (companyName?.includes("stellaris")) return "stellaris";
      } catch (error) {
        console.warn("Failed to parse user data:", error);
      }
    }
  }

  return null;
}

/**
 * Feature flag helpers for easy use in components
 */
export const useClientFeatures = () => {
  const config = getClientConfig();
  return config.features;
};

/**
 * Branding helpers
 */
export const useClientBranding = () => {
  const config = getClientConfig();
  return config.branding;
};

/**
 * Business configuration helpers
 */
export const useClientBusiness = () => {
  const config = getClientConfig();
  return config.business;
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (
  feature: keyof ClientConfig["features"]
): boolean => {
  const config = getClientConfig();
  return config.features[feature];
};

/**
 * Get client-specific terms and conditions
 */
export const getClientTerms = () => {
  const config = getClientConfig();
  const { clientId, business } = config;

  switch (clientId) {
    case "akg":
      return `1. Taxes: GST @${business.taxRate}% shall be charged extra.
2. Payment Term: ${business.paymentTerms}
3. Freight: Extra as per Actual.
4. Delivery: ${business.deliveryTerms}
5. Conduit Packing: We supply the material in Standard Length of 3 Meters, However we may supply approx 5% to 10% of the total quantity in non standard length ranging between 2.45 mtr. (8') & 3 mtr. (10').
6. Dimensions: All dimensions of the Rigid MS/GI Conduits will be as per IS:9537 (Part-II/1981) with tolerance thereon.
7. Validity: Our rates are valid for ${business.validityDays} days only from the date of this offer
8. Insurance: if required charges will be in your Account.`;

    case "norpack":
      return `1. Taxes: GST as applicable will be charged extra.
2. Payment Terms: ${business.paymentTerms}
3. Freight: Extra on actuals.
4. Delivery: ${business.deliveryTerms}
5. Quality: Supply as per agreed specifications and standards.
6. Insurance: If required, to be borne by the buyer.
7. Validity: Our rates are valid for ${business.validityDays} days from the date of this offer.`;

    default:
      return `1. Taxes: GST @${business.taxRate}% shall be charged extra.
2. Payment Terms: ${business.paymentTerms}
3. Delivery: ${business.deliveryTerms}
4. Validity: Our rates are valid for ${business.validityDays} days from the date of this offer.`;
  }
};

/**
 * Get client-specific contact information
 */
export const getClientContact = () => {
  const config = getClientConfig();
  const { clientId, branding } = config;

  switch (clientId) {
    case "akg":
      return {
        name: "Mukesh Kumar",
        title: "Sr. Sales Manager",
        phone: "(M)+91-8860882668",
        email: branding.supportEmail,
      };

    case "norpack":
      return {
        name: "Arun Kumar Sharma",
        title: "(AGM Sales)",
        phone: "(M)+91-88003 68579",
        email: branding.supportEmail,
      };

    default:
      return {
        name: "Sales Team",
        title: "Sales Representative",
        phone: "+91-XXXXXXXXXX",
        email: branding.supportEmail,
      };
  }
};

/**
 * Get available brands for the current client
 */
export const getAvailableBrands = (allBrands: string[] = []): string[] => {
  const config = getClientConfig();
  const { brands } = config;

  if (brands.showOnlyClientBrands) {
    return brands.allowedBrands;
  }

  // For other clients, return all unique brands from the data
  return [...new Set(allBrands)].filter(
    (brand) => brand && brand.trim() !== ""
  );
};

/**
 * Get default brand for the current client
 */
export const getDefaultBrand = (): string => {
  const config = getClientConfig();
  return config.brands.defaultBrand;
};
