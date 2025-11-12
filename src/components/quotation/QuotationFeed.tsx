import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconFileReport,
  IconX,
} from "@tabler/icons-react";
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import QuotationTable from "./QuotationTable";
import { useQuotationStore } from "../../stores";
import type { QuotationFeedProps, Quotation } from "../../types/common";
import { Button } from "../ui/Button";
import { IconRefresh } from "@tabler/icons-react";
import { Tooltip } from "../ui/Tooltip";
import { Input } from "../ui/Input";
import { formatDateForDisplay } from "../../utils/dateUtils";
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

const EmptyState = React.memo(() => (
  <div className="text-center py-12">
    <IconFileReport className="w-12 h-12 text-gray-light mx-auto mb-4" />
    <p className="text-sm text-gray-light mb-2">No quotations found</p>
    <p className="text-xs text-gray-light">
      Quotations will appear here when they are created
    </p>
  </div>
));

EmptyState.displayName = "EmptyState";

const QuotationFeed: React.FC<QuotationFeedProps> = React.memo(
  ({
    quotations: propQuotations,
    pagination: externalPagination,
    onPageChange,
    onStatusFilterChange,
    onSearchChange,
    onRefreshClick,
    refreshLabel,
    isRefreshing,
  }) => {
    const { quotations: contextQuotations, processingNew } =
      useQuotationStore();
    const quotationsToUse = propQuotations || contextQuotations;

    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 20,
    });
    const [statusFilter, setStatusFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [dataVersion, setDataVersion] = useState(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{
      salesperson?: string;
      region?: string;
      source?: string;
    }>({});
    const filterRef = useRef<HTMLDivElement | null>(null);
    const activeFilterCount = useMemo(() => {
      const adv = Object.values(filters).filter(Boolean).length;
      const status = statusFilter ? 1 : 0;
      return adv + status;
    }, [filters, statusFilter]);

    const processingPlaceholder: Quotation | null = useMemo(() => {
      if (!processingNew) return null;
      return {
        id: "processing-placeholder",
        quote_id: "",
        reference_number: "",
        rfqId: "",
        date: new Date().toISOString(),
        customer_info: {
          customer_email: null,
          customer_name: null,
          customer_phone: null,
          customer_address: null,
        },
        amount: 0,
        lastUpdate: new Date().toISOString(),
        status: "processing" as any,
        items: [],
        subtotal: 0,
        totalAmountDue: 0,
        norpackAkg: "",
        originalRfq: undefined as any,
      } as Quotation;
    }, [processingNew]);

    const displayQuotations = useMemo(() => {
      const base = processingPlaceholder
        ? [processingPlaceholder, ...quotationsToUse]
        : quotationsToUse;
      const hasFilters = Object.values(filters).some(Boolean);
      if (!hasFilters) return base;
      return base.filter((q: any) => {
        const qSales = (
          q?.salesperson ||
          q?.created_by?.name ||
          q?.created_by_name ||
          ""
        )
          .toString()
          .toLowerCase();
        const qRegion = (q?.region || q?.customer_info?.region || "")
          .toString()
          .toLowerCase();
        const qSource = (q?.source || q?.lead_source || "")
          .toString()
          .toLowerCase();
        const condSales = filters.salesperson
          ? qSales.includes(filters.salesperson.toLowerCase())
          : true;
        const condRegion = filters.region
          ? qRegion.includes(filters.region.toLowerCase())
          : true;
        const condSource = filters.source
          ? qSource.includes(filters.source.toLowerCase())
          : true;
        return condSales && condRegion && condSource;
      });
    }, [processingPlaceholder, quotationsToUse, filters]);

    const filterOptions = useMemo(() => {
      const salespersons = new Set<string>();
      const regions = new Set<string>();
      const sources = new Set<string>();
      (quotationsToUse || []).forEach((q: any) => {
        const s = (
          q?.salesperson ||
          q?.created_by?.name ||
          q?.created_by_name ||
          ""
        )
          .toString()
          .trim();
        const r = (q?.region || q?.customer_info?.region || "")
          .toString()
          .trim();
        const so = (q?.source || q?.lead_source || "").toString().trim();
        if (s) salespersons.add(s);
        if (r) regions.add(r);
        if (so) sources.add(so);
      });
      return {
        salespersons: Array.from(salespersons).sort(),
        regions: Array.from(regions).sort(),
        sources: Array.from(sources).sort(),
      };
    }, [quotationsToUse]);

    const columns = useMemo<ColumnDef<Quotation>[]>(
      () => [
        {
          accessorKey: "status",
          header: "Quotes Status & ID",
          cell: ({ row }) => (
            <div className="flex gap-1 items-center">
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  row.original.status === "approved"
                    ? "bg-green-lightest text-green-dark"
                    : row.original.status === "processed"
                    ? "bg-blue-100 text-blue-darkest"
                    : row.original.status === "sent"
                    ? "bg-yellow-light text-yellow-darkest"
                    : row.original.status === "processing"
                    ? "bg-pink-lightest text-pink-dark"
                    : "bg-gray-100 text-gray-dark"
                }`}
              >
                {row.original.status === "approved"
                  ? "Approved"
                  : row.original.status === "processed"
                  ? "Processed"
                  : row.original.status === "sent"
                  ? "Sent"
                  : row.original.status === "processing"
                  ? "Processing"
                  : row.original.status}
              </span>
              {row.original.status === "processing" ? (
                <span className="inline-flex items-center gap-2 text-gray-light">
                  <span className="w-3 h-3 rounded-full border-2 border-pink-dark border-t-transparent animate-spin" />
                  <span className="text-xs text-gray-400">—</span>
                </span>
              ) : (
                <>{row.original.rfqId || row.original.quote_id}</>
              )}
            </div>
          ),
        },
        {
          accessorKey: "customerName",
          header: "Customer",
          cell: ({ row }) =>
            row.original.status === "processing" ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Loading…</span>
              </div>
            ) : (
              row.original?.customer_info?.customer_name || "-"
            ),
        },
        {
          accessorKey: "amount",
          header: "Amount",
          cell: ({ row, getValue }) =>
            row.original.status === "processing" ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Loading…</span>
              </div>
            ) : (
              new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
              }).format(Number(getValue()))
            ),
        },
        {
          accessorKey: "date",
          header: "Date",
          cell: ({ row, getValue }) =>
            row.original.status === "processing" ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Wait for 3 min</span>
              </div>
            ) : (
              formatDateForDisplay(getValue() as string)
            ),
        },
      ],
      []
    );

    const table = useReactTable({
      data: displayQuotations,
      columns,
      state: {
        globalFilter,
        pagination,
        columnFilters,
      },
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange: setPagination,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    });

    const statusOptions = useMemo(
      () => [
        { label: "All", value: "" },
        { label: "Sent", value: "sent" },
        { label: "Approved", value: "approved" },
        { label: "Processed", value: "processed" },
      ],
      []
    );

    const handleStatusFilterChange = useCallback((value: string | number) => {
      setStatusFilter(String(value));
    }, []);

    const handlePreviousPage = useCallback(() => {
      table.previousPage();
    }, [table]);

    const handleNextPage = useCallback(() => {
      table.nextPage();
    }, [table]);

    useEffect(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      setDataVersion((v) => v + 1);
    }, [displayQuotations]);

    useEffect(() => {
      if (statusFilter) {
        setColumnFilters([{ id: "status", value: statusFilter }]);
      } else {
        setColumnFilters((prev) => prev.filter((f) => f.id !== "status"));
      }
    }, [statusFilter]);

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (
          filterRef.current &&
          !filterRef.current.contains(e.target as Node)
        ) {
          setIsFilterOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    if (!displayQuotations || displayQuotations.length === 0) {
      return <EmptyState />;
    }

    return (
      <div
        className="bg-background-light rounded-lg border border-border-dark"
        key={dataVersion}
      >
        <div className="flex items-center justify-between gap-4 px-2 sm:px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-light" />
            <Input
              type="text"
              variant="search"
              placeholder="Search all quotes"
              value={globalFilter}
              onChange={(e) => {
                const val = e.target.value;
                setGlobalFilter(val);
                onSearchChange?.(val);
              }}
            />
          </div>
          <div className="flex items-center gap-2 min-w-32">
            {/* Advanced Filter Button */}
            <div className="relative" ref={filterRef}>
              <Button
                variant="back"
                onClick={() => setIsFilterOpen((o) => !o)}
                className="relative"
              >
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-gray-700 text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-[320px] sm:w-[420px] bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50">
                  <div className="relative flex-1 max-w-md">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-light" />
                    <Input
                      type="text"
                      variant="searchDark"
                      placeholder="Search name, region, source"
                      value={globalFilter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGlobalFilter(val);
                        onSearchChange?.(val);
                      }}
                    />
                  </div>

                  {/* Selected pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {statusFilter && (
                      <span className="inline-flex items-center gap-1 bg-background-light px-2 py-1 rounded-full text-xs">
                        {statusOptions.find(
                          (o) => String(o.value) === statusFilter
                        )?.label || statusFilter}
                        <button
                          className="text-gray-500"
                          onClick={() => setStatusFilter("")}
                          aria-label="Clear status filter"
                        >
                          <IconX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.salesperson && (
                      <span className="inline-flex items-center gap-1 bg-background-light px-2 py-1 rounded-full text-xs">
                        {filters.salesperson}
                        <button
                          className="text-gray-500"
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              salesperson: undefined,
                            }))
                          }
                          aria-label="Clear salesperson"
                        >
                          <IconX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.region && (
                      <span className="inline-flex items-center gap-1 bg-background-light px-2 py-1 rounded-full text-xs">
                        {filters.region}
                        <button
                          className="text-gray-500"
                          onClick={() =>
                            setFilters((f) => ({ ...f, region: undefined }))
                          }
                          aria-label="Clear region"
                        >
                          <IconX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.source && (
                      <span className="inline-flex items-center gap-1 bg-background-light px-2 py-1 rounded-full text-xs">
                        {filters.source}
                        <button
                          className="text-gray-500"
                          onClick={() =>
                            setFilters((f) => ({ ...f, source: undefined }))
                          }
                          aria-label="Clear source"
                        >
                          <IconX className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {/* Status */}
                    <div className="py-2 grid grid-cols-[120px_1fr] items-start gap-2">
                      <div className="text-sm text-gray-dark flex items-center gap-2">
                        <span>Status</span>
                      </div>
                      <div className="space-y-1">
                        {statusOptions.map((opt) => (
                          <button
                            key={String(opt.value)}
                            onClick={() =>
                              handleStatusFilterChange(String(opt.value))
                            }
                            className={`w-full text-left px-2 py-1 rounded text-sm ${
                              statusFilter === String(opt.value)
                                ? "bg-background-light text-gray-dark"
                                : "hover:bg-background-lightest"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="py-2 grid grid-cols-[120px_1fr] items-start gap-2">
                      <div className="text-sm text-gray-dark flex items-center gap-2">
                        <span>Salesperson</span>
                      </div>
                      <div className="space-y-1">
                        {filterOptions.salespersons.length === 0 ? (
                          <div className="text-xs text-gray-light">No data</div>
                        ) : (
                          filterOptions.salespersons.map((name) => (
                            <button
                              key={name}
                              onClick={() =>
                                setFilters((f) => ({ ...f, salesperson: name }))
                              }
                              className={`w-full text-left px-2 py-1 rounded text-sm ${
                                filters.salesperson === name
                                  ? "bg-background-light text-gray-dark"
                                  : "hover:bg-background-lightest"
                              }`}
                            >
                              {name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="py-2 grid grid-cols-[120px_1fr] items-start gap-2">
                      <div className="text-sm text-gray-dark flex items-center gap-2">
                        <span>Region</span>
                      </div>
                      <div className="space-y-1">
                        {filterOptions.regions.length === 0 ? (
                          <div className="text-xs text-gray-light">No data</div>
                        ) : (
                          filterOptions.regions.map((region) => (
                            <button
                              key={region}
                              onClick={() =>
                                setFilters((f) => ({ ...f, region }))
                              }
                              className={`w-full text-left px-2 py-1 rounded text-sm ${
                                filters.region === region
                                  ? "bg-background-light text-gray-dark"
                                  : "hover:bg-background-lightest"
                              }`}
                            >
                              {region}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="py-2 grid grid-cols-[120px_1fr] items-start gap-2">
                      <div className="text-sm text-gray-dark flex items-center gap-2">
                        <span>Source</span>
                      </div>
                      <div className="space-y-1">
                        {filterOptions.sources.length === 0 ? (
                          <div className="text-xs text-gray-light">No data</div>
                        ) : (
                          filterOptions.sources.map((src) => (
                            <button
                              key={src}
                              onClick={() =>
                                setFilters((f) => ({ ...f, source: src }))
                              }
                              className={`w-full text-left px-2 py-1 rounded text-sm ${
                                filters.source === src
                                  ? "bg-background-light text-gray-dark"
                                  : "hover:bg-background-lightest"
                              }`}
                            >
                              {src}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <Button
                      variant="outline"
                      className="rounded-full px-5"
                      onClick={() => {
                        setFilters({});
                        setGlobalFilter("");
                        setStatusFilter("");
                        onSearchChange?.("");
                        onStatusFilterChange?.("");
                        setIsFilterOpen(false);
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="px-5"
                      onClick={() => {
                        // propagate to parent to trigger API fetch
                        onStatusFilterChange?.(statusFilter || "");
                        onSearchChange?.(globalFilter || "");
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {onRefreshClick && (
              <Tooltip
                content={refreshLabel || "Refresh quotations"}
                position="top"
              >
                <Button
                  onClick={onRefreshClick}
                  variant="ghost"
                  disabled={isRefreshing}
                >
                  <IconRefresh
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="px-2 sm:px-6">
          <QuotationTable table={table} />
        </div>

        <div className="sm:hidden">
          {/* Row selection info */}
          <div className="px-2 sm:px-6 py-3 border-b border-gray-200">
            <p className="text-xs text-gray-light text-center">
              Total {externalPagination?.totalItems ?? displayQuotations.length}{" "}
              quotes found
            </p>
          </div>

          {/* Pagination controls */}
          <div className="px-4 py-3 space-y-3">
            {/* Page info and navigation */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-light">
                Page{" "}
                {externalPagination?.currentPage ??
                  table.getState().pagination.pageIndex + 1}{" "}
                of {externalPagination?.totalPages ?? table.getPageCount()}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (externalPagination && onPageChange) {
                      if (externalPagination.hasPrevious)
                        onPageChange(externalPagination.currentPage - 1);
                    } else {
                      handlePreviousPage();
                    }
                  }}
                  disabled={
                    externalPagination
                      ? !externalPagination.hasPrevious
                      : !table.getCanPreviousPage()
                  }
                  variant="back"
                  size="sm"
                  className="p-2"
                >
                  <IconChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    if (externalPagination && onPageChange) {
                      if (externalPagination.hasNext)
                        onPageChange(externalPagination.currentPage + 1);
                    } else {
                      handleNextPage();
                    }
                  }}
                  disabled={
                    externalPagination
                      ? !externalPagination.hasNext
                      : !table.getCanNextPage()
                  }
                  variant="back"
                  size="sm"
                  className="p-2"
                >
                  <IconChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results summary */}
            <div className="text-center">
              <span className="text-xs text-gray-light">
                Showing{" "}
                {externalPagination
                  ? (externalPagination.currentPage - 1) *
                      externalPagination.pageSize +
                    1
                  : table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1}{" "}
                -{" "}
                {externalPagination
                  ? Math.min(
                      externalPagination.currentPage *
                        externalPagination.pageSize,
                      externalPagination.totalItems
                    )
                  : Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      table.getRowModel().rows.length
                    )}{" "}
                of{" "}
                {externalPagination?.totalItems ??
                  table.getRowModel().rows.length}{" "}
                results
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Layout (Original) */}
        <div className="hidden sm:flex items-center justify-between px-2 sm:px-6 p-4">
          <p className="text-sm text-gray-light">
            Total{" "}
            {externalPagination?.totalItems ?? table.getRowModel().rows.length}{" "}
            quotes found
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-light">
                Page{" "}
                {externalPagination?.currentPage ??
                  table.getState().pagination.pageIndex + 1}{" "}
                of {externalPagination?.totalPages ?? table.getPageCount()}
              </span>
              <div className="flex gap-1">
                <Button
                  onClick={() => {
                    if (externalPagination && onPageChange) {
                      if (externalPagination.hasPrevious)
                        onPageChange(externalPagination.currentPage - 1);
                    } else {
                      handlePreviousPage();
                    }
                  }}
                  disabled={
                    externalPagination
                      ? !externalPagination.hasPrevious
                      : !table.getCanPreviousPage()
                  }
                  variant="back"
                  size="sm"
                >
                  <IconChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    if (externalPagination && onPageChange) {
                      if (externalPagination.hasNext)
                        onPageChange(externalPagination.currentPage + 1);
                    } else {
                      handleNextPage();
                    }
                  }}
                  disabled={
                    externalPagination
                      ? !externalPagination.hasNext
                      : !table.getCanNextPage()
                  }
                  variant="back"
                  size="sm"
                >
                  <IconChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

QuotationFeed.displayName = "QuotationFeed";

export default QuotationFeed;
