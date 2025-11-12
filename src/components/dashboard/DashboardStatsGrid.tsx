import React, { useMemo } from "react";
import StatCard from "./StatCard";
import {
  IconFileReport,
  IconMailOpened,
  IconSend,
} from "@tabler/icons-react";
import type { DashboardStatistics } from "../../types/common";

interface DashboardStatsGridProps {
  dashboardStats?: DashboardStatistics | null;
  isLoading?: boolean;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = React.memo(({
  dashboardStats,
  isLoading = false,
}) => {
  const statCards = useMemo(() => [
    {
      title: "Total Quotations",
      value: dashboardStats?.totals.total_quotations || 0,
      subtitle: "total quotation requests",
      icon: IconMailOpened,
    },
    {
      title: "Processed Quotations",
      value: dashboardStats?.totals.processed_quotations || 0,
      subtitle: "pending internal approval before sending",
      icon: IconFileReport,
    },
    {
      title: "Approved Quotations",
      value: dashboardStats?.totals.approved_quotations || 0,
      subtitle: "shared with customers",
      icon: IconSend,
    },
  ], [dashboardStats?.totals.total_quotations, dashboardStats?.totals.processed_quotations, dashboardStats?.totals.approved_quotations]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((card, index) => (
        <StatCard
          key={`${card.title}-${index}`}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
});

DashboardStatsGrid.displayName = 'DashboardStatsGrid';

export default DashboardStatsGrid;
