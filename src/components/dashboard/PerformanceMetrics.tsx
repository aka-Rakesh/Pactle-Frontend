import React from "react";
import StatCard from "./StatCard";
import { IconTarget, IconCheck, IconPercentage, IconTrendingUp } from "@tabler/icons-react";
import type { PerformanceMetrics } from "../../types/common";

interface PerformanceMetricsGridProps {
  performanceStats?: PerformanceMetrics | null;
  isLoading?: boolean;
}

const PerformanceMetricsGrid: React.FC<PerformanceMetricsGridProps> = ({
  performanceStats,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="bg-background-light rounded-lg border border-border-dark p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  const performanceCards = [
    {
      title: "Match Success Rate",
      value: `${performanceStats?.match_success_rate || 0}%`,
      subtitle: "successful item matches",
      icon: IconTarget,
    },
    {
      title: "Total Items Processed",
      value: performanceStats?.total_items_processed || 0,
      subtitle: "items across all quotations",
      icon: IconCheck,
    },
    {
      title: "Successful Matches",
      value: performanceStats?.successful_matches || 0,
      subtitle: "items successfully matched",
      icon: IconTrendingUp,
    },
    {
      title: "Average Match Rate",
      value: `${performanceStats?.average_match_rate || 0}%`,
      subtitle: "average matching accuracy",
      icon: IconPercentage,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-dark">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetricsGrid; 