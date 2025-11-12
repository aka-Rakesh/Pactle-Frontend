import React, { useState, useMemo, useEffect, Suspense, lazy, useCallback, useRef } from "react";
import TimeRangeSelector from "../../components/dashboard/TimeRangeSelector";
import DashboardStatsGrid from "../../components/dashboard/DashboardStatsGrid";
import QuickActionsPanel from "../../components/dashboard/QuickActionPanel";
import QuotationFeed from "../../components/quotation/QuotationFeed";
import { useQuotationStats, useQuotationsList } from "../../hooks";
import type { Quotation, TimeRangeParams } from "../../types/common";
import { useQuotationStore } from "../../stores";
const AddQuotationModal = lazy(() => import("../../components/modal/AddQuotationModal"));

const QuotationsPage: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );
  const [apiQuotations, setApiQuotations] = useState<Quotation[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const { dashboardStats, isLoading, refetch } = useQuotationStats();
  const { processingNew, stopProcessingNew, setProcessingBaseline, clearProcessingBaseline, processingBaselineTotal, processingBaselineLatestCreatedAt } = useQuotationStore();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: quotationsList, refetch: refetchQuotations } = useQuotationsList({
    page,
    page_size: pageSize,
    status: statusFilter,
    search: searchQuery,
    content_type: undefined,
    from_date: undefined,
    to_date: undefined,
  });

  const allQuotations = useMemo(() => {
    return apiQuotations;
  }, [apiQuotations]);

  const convertApiQuotations = useCallback((data: any) => {
    return data.data.quotations.map((q: any) => ({
      id: q.quote_id,
      quote_id: q.quote_id,
      rfqId: q.quote_id,
      date: q.created_at,
      customer_info: {
        customer_email: q.company_name || q?.customer_info?.customer_email || '',
        customer_name:  q?.customer_info?.customer_name || '',
        customer_phone: q?.customer_info?.customer_phone || '',
        customer_address: q?.customer_info?.customer_address || '',
      },
      amount: q.total_amount,
      lastUpdate: q.created_at,
      status: q.status.toLowerCase() as any,
      items: [],
      subtotal: q.total_amount,
      totalAmountDue: q.total_amount,
    }));
  }, []);

  const getLatestCreatedAt = useCallback((list: Quotation[]) => {
    const dates = (list || []).map((q) => q.date).filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });
  }, []);

  const generateRFQId = useCallback(() => {
    return "";
  }, []);

  const handleSaveQuotation = useCallback(async () => {
    try {
      const updated = await refetchQuotations();
      const list = updated.data;
      if (list) {
        const convertedQuotations = convertApiQuotations(list);
        setApiQuotations(convertedQuotations);
        const p = list.data.pagination;
        setTotalItems(p.total_items);
        setTotalPages(p.total_pages);
      }
    } catch (error) {
      console.warn('Failed to refresh quotations after save:', error);
    }

    setIsModalOpen(false);
  }, [refetchQuotations, convertApiQuotations]);

  const maybeStopProcessing = useCallback((convertedQuotations: Quotation[], newTotalItems: number) => {
    if (!processingNew) return;
    const baselineTotal = processingBaselineTotal ?? 0;
    const listLatest = getLatestCreatedAt(convertedQuotations);
    const baselineLatest = processingBaselineLatestCreatedAt;
    if (newTotalItems > baselineTotal) {
      stopProcessingNew();
      clearProcessingBaseline();
      return;
    }
    if (listLatest && baselineLatest && new Date(listLatest) > new Date(baselineLatest)) {
      stopProcessingNew();
      clearProcessingBaseline();
    }
  }, [processingNew, processingBaselineTotal, processingBaselineLatestCreatedAt, stopProcessingNew, clearProcessingBaseline, getLatestCreatedAt]);

  const refreshQuotationsOnly = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const updated = await refetchQuotations();
      const list = updated.data;
      if (list) {
        const convertedQuotations = convertApiQuotations(list);
        setApiQuotations(convertedQuotations);
        const p = list.data.pagination;
        setTotalItems(p.total_items);
        setTotalPages(p.total_pages);
        setLastRefreshedAt(new Date());
        maybeStopProcessing(convertedQuotations, p.total_items);
      }
    } catch (err) {
      console.warn('Manual refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchQuotations, convertApiQuotations, maybeStopProcessing]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchQuotations();
    }, 180000);
    return () => clearInterval(interval);
  }, [refetchQuotations]);

  useEffect(() => {
    if (!quotationsList) return;
    const convertedQuotations = convertApiQuotations(quotationsList);
    setApiQuotations(convertedQuotations);
    const p = quotationsList.data.pagination;
    setTotalItems(p.total_items);
    setTotalPages(p.total_pages);
    maybeStopProcessing(convertedQuotations, p.total_items);
  }, [quotationsList, convertApiQuotations, maybeStopProcessing]);

  const handleQuotationClick = useCallback((quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsModalOpen(true);
  }, []);

  const handleAddQuotation = useCallback(() => {
    setSelectedQuotation(null);
    setProcessingBaseline(totalItems, getLatestCreatedAt(allQuotations));
    setIsModalOpen(true);
  }, [totalItems, allQuotations, getLatestCreatedAt, setProcessingBaseline]);

  const handleTimeRangeChange = useCallback(async (params: TimeRangeParams) => {
    await refetch(params);
  }, [refetch]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:gap-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
            <QuickActionsPanel onButtonClick={handleAddQuotation}/>
          </div>

          <DashboardStatsGrid 
            dashboardStats={dashboardStats} 
            isLoading={isLoading} 
          />
          <QuotationFeed 
            onQuotationClick={handleQuotationClick}
            quotations={allQuotations}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: totalItems,
              totalPages: totalPages,
              hasNext: page < totalPages,
              hasPrevious: page > 1,
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(size) => setPageSize(Number(size))}
            onStatusFilterChange={(status: string) => {
              setStatusFilter(status || undefined);
              setPage(1);
            }}
            onSearchChange={(val: string) => {
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = setTimeout(() => {
                setSearchQuery(val || undefined);
                setPage(1);
              }, 300);
            }}
            onRefreshClick={refreshQuotationsOnly}
            refreshLabel={lastRefreshedAt ? `Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}` : 'Refresh quotations'}
            isRefreshing={isRefreshing}
          />
        </div>

      </div>

      <Suspense fallback={null}>
        <AddQuotationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          quotation={selectedQuotation}
          onSave={handleSaveQuotation}
          generateRFQId={generateRFQId}
        />
      </Suspense>
    </div>
  );
});

QuotationsPage.displayName = 'QuotationsPage';

export default QuotationsPage;
