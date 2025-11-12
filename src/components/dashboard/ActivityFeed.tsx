import React from "react";
import ActivityTable from "./ActivityTable";
import { useDashboardStore } from "../../stores";
import { IconFilter, IconSearch } from "@tabler/icons-react";
import { Input } from "../ui/Input";

const ActivityFeed: React.FC = () => {
  const {
    activitySearch,
    setActivitySearch,
    paginatedActivities,
    currentPage,
    totalPages,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
  } = useDashboardStore();

  return (
    <div className="lg:col-span-3 bg-background-light rounded-lg border border-gray-200">
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-light" />
            <Input
              type="text"
              variant={"search"}
              placeholder="Search activity"
              value={activitySearch}
              onChange={(e) => {
                setActivitySearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="flex items-center px-3 py-2 gap-2 bg-white text-gray-light hover:text-gray-dark border border-gray-200 rounded-md transition-colors text-xs cursor-pointer">
            <IconFilter className="w-4 h-4" />
            <span className="s-only">Filters</span>
          </button>
        </div>
      </div>

      <ActivityTable
        activities={paginatedActivities}
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

export default ActivityFeed;
