import { create } from 'zustand';
import type { DashboardStats, Activity, Alert } from '../types/common';

interface DashboardState {
  timeRange: string;
  searchTerm: string;
  activitySearch: string;
  currentPage: number;
  rowsPerPage: number;
  dashboardStats: DashboardStats;
  filteredActivities: Activity[];
  paginatedActivities: Activity[];
  totalPages: number;
  alerts: Alert[];
}

interface DashboardActions {
  setTimeRange: (range: string) => void;
  setSearchTerm: (term: string) => void;
  setActivitySearch: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
}

type DashboardStore = DashboardState & DashboardActions;

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  timeRange: '7days',
  searchTerm: '',
  activitySearch: '',
  currentPage: 1,
  rowsPerPage: 10,
  alerts: [],

  // Computed dashboard stats with time range filtering
  get dashboardStats(): DashboardStats {
    const { timeRange } = get();
    const baseStats = {
      openQuotes: { count: 0, subtitle: "No quotes waiting for response" },
      openPurchaseOrders: { count: 0, subtitle: "No purchase orders past expected date" },
      openSalesOrders: { count: 0, subtitle: "No sales orders remaining approval" },
      outstandingInvoices: {
        amount: 0,
        subtitle: "No outstanding invoices",
      },
    };

    if (timeRange === "30days") {
      return {
        ...baseStats,
        openQuotes: {
          ...baseStats.openQuotes,
          count: baseStats.openQuotes.count,
        },
        openPurchaseOrders: {
          ...baseStats.openPurchaseOrders,
          count: baseStats.openPurchaseOrders.count,
        },
      };
    }

    return baseStats;
  },

  // Computed filtered activities based on search
  get filteredActivities(): Activity[] {
    const { activitySearch } = get();
    const activities: Activity[] = [];
    return activities.filter(
      (activity) =>
        activity.description
          .toLowerCase()
          .includes(activitySearch.toLowerCase()) ||
        activity.type.toLowerCase().includes(activitySearch.toLowerCase())
    );
  },

  // Computed paginated activities
  get paginatedActivities(): Activity[] {
    const { currentPage, rowsPerPage, filteredActivities } = get();
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  },

  // Computed total pages
  get totalPages(): number {
    const { filteredActivities, rowsPerPage } = get();
    return Math.ceil(filteredActivities.length / rowsPerPage);
  },

  // Actions
  setTimeRange: (range: string) => set({ timeRange: range }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setActivitySearch: (term: string) => set({ activitySearch: term }),
  setCurrentPage: (page: number) => set({ currentPage: page }),
  setRowsPerPage: (rows: number) => set({ rowsPerPage: rows }),
})); 