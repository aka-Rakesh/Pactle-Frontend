import React, { useState } from "react";
import {
  IconArrowsUpDown,
  IconChevronLeft,
  IconChevronRight,
  IconActivity,
} from "@tabler/icons-react";
import type { ActivityTableProps } from "../../types/common";
import { Button } from "../ui/Button";
import { Dropdown } from "../ui/DropDown";

import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "received":
    case "created":
    case "approved":
    case "raised":
    case "sent":
      return "bg-green-darkest opacity-70";
    case "approve":
    case "confirm":
    case "review":
    case "rfq":
      return "bg-green-darkest";
    case "awaiting po":
    case "draft":
      return "bg-yellow-darkest opacity-70";
    default:
      return "bg-green-darkest opacity-70";
  }
};

const columnHelper = createColumnHelper<any>();

const ActivityTable: React.FC<ActivityTableProps> = ({
  activities,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    columnHelper.accessor("description", {
      header: () => (
        <div className="flex items-center justify-between cursor-pointer">
          <span>Description</span>
          <IconArrowsUpDown className="w-3 h-3" />
        </div>
      ),
      cell: (info) => (
        <div className="flex items-start space-x-3">
          <span className="text-xs font-medium px-2 py-1 rounded min-w-0 whitespace-nowrap border border-border-dark">
            {info.row.original.type}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-dark leading-5">
              {info.getValue()}
            </p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: () => (
        <div className="flex items-center justify-start space-x-1 cursor-pointer">
          <span>Status</span>
          <IconArrowsUpDown className="w-3 h-3" />
        </div>
      ),
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium text-white ${getStatusColor(
            info.getValue()
          )}`}
        >
          {info.getValue()}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: activities,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: rowsPerPage,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // external pagination
    pageCount: totalPages,
  });

  const rowsOptions = [
    { label: "10", value: "10" },
    { label: "20", value: "20" },
    { label: "30", value: "30" },
  ];

  return (
    <div className="overflow-x-auto px-6 pt-6">
      {activities && activities.length > 0 ? (
        <>
          <table className="bg-white w-full rounded-lg">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-gray-200"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`py-3 px-4 text-sm font-medium text-gray-light ${
                        header.index === 1 ? "text-right" : "text-left"
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`py-3 px-4 ${
                        cell.column.id === "status" ? "text-left" : ""
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 p-4">
            <p className="text-sm text-gray-light">
              {"0"} of {activities.length} row(s) selected.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-light">Rows per page</span>
                <Dropdown
                  options={rowsOptions}
                  selected={String(rowsPerPage)}
                  size="sm"
                  onChange={(value) => {
                    setRowsPerPage(Number(value));
                    onPageChange(1); // reset to page 1
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-light">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={!table.getCanPreviousPage()}
                    variant="back"
                    size="sm"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={!table.getCanNextPage()}
                    variant="back"
                    size="sm"
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <IconActivity className="w-12 h-12 text-gray-light mx-auto mb-4" />
          <p className="text-sm text-gray-light mb-2">No activities found</p>
          <p className="text-xs text-gray-light">Activities will appear here when they occur</p>
        </div>
      )}
    </div>
  );
};

export default ActivityTable;