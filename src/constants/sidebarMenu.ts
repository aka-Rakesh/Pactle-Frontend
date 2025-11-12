import {
  IconCube,
  IconReceipt,
  IconListDetails,
  IconLifebuoy,
} from "@tabler/icons-react";
import type { SidebarMenuItem } from "../types/common";

export const sidebarMenuItems: SidebarMenuItem[] = [
  {
    id: "overview",
    label: "Quotations",
    icon: IconReceipt,
    path: "/dashboard",
  },
  {
    id: "raw-material-sheet",
    label: "Raw Material Sheet",
    icon: IconCube,
    path: "/dashboard/raw-material-sheet",
  },
  {
    id: "sku-list",
    label: "SKU List",
    icon: IconListDetails,
    path: "/dashboard/sku-list",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: IconLifebuoy,
    path: "/dashboard/help",
  },
];