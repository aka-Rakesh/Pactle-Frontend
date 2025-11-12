/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  getClientConfig,
  getClientConfigWithClientId,
  useClientFeatures,
  getAvailableBrands,
  getDefaultBrand,
} from "../constants/clientConfig";
import { useAuthStore } from "../stores";

const getClientIdFromAuthStore = (user: any): string | null => {
  if (!user) {
    return null;
  }

  const companyName = user?.company_name?.toLowerCase();

  if (companyName?.includes("akg")) return "akg";
  if (companyName?.includes("norpack")) return "norpack";
  if (companyName?.includes("stellaris")) return "stellaris";
  return null;
};

/**
 * Hook to access client configuration
 * This provides a reactive way to access client-specific settings
 */
export const useClientConfig = () => {
  const { user } = useAuthStore();

  const config = useMemo(() => {
    const authClientId = getClientIdFromAuthStore(user);

    if (authClientId) {
      const clientConfig = getClientConfigWithClientId(authClientId);
      return clientConfig;
    }

    const defaultConfig = getClientConfig();
    return defaultConfig;
  }, [user]);

  return {
    ...config,
    features: config.features,
    branding: config.branding,
    business: config.business,
    brands: config.brands,
    roles: config.roles,
    permissions: config.permissions,
  };
};

/**
 * Hook to check if a specific feature is enabled
 */
export const useFeatureFlag = (
  feature: keyof ReturnType<typeof useClientFeatures>
) => {
  const features = useClientFeatures();
  return features[feature];
};

/**
 * Hook to get client-specific terms and conditions
 */
export const useClientTerms = () => {
  return useMemo(() => {
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
  }, []);
};

/**
 * Hook to get client-specific contact information
 */
export const useClientContact = () => {
  return useMemo(() => {
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
  }, []);
};

/**
 * Hook to get available brands for the current client
 */
export const useAvailableBrands = (allBrands: string[] = []) => {
  return useMemo(() => getAvailableBrands(allBrands), [allBrands]);
};

/**
 * Hook to get default brand for the current client
 */
export const useDefaultBrand = () => {
  return useMemo(() => getDefaultBrand(), []);
};
