import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Quotation } from "../../types/common";
import { type Table, flexRender } from "@tanstack/react-table";

interface QuotationTableProps {
  table: Table<Quotation>;
}

const QuotationTable: React.FC<QuotationTableProps> = React.memo(({ table }) => {
  const navigate = useNavigate();

  const handleRowClick = useCallback((row: Quotation) => {
    if (row.id === 'processing-placeholder' || row.status === 'processing') return;
    navigate(`/dashboard/quotations/${row.rfqId}`);
  }, [navigate]);

  return (
    <div className="bg-white rounded-lg border border-border-dark max-h-[60vh] sm:max-h-[550px] overflow-y-auto">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-light"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-2 hover:text-gray-dark"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`transition-colors ${row.original.status === 'processing' ? 'cursor-default bg-red-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-xs text-gray-dark whitespace-nowrap min-w-[11rem]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

QuotationTable.displayName = 'QuotationTable';

export default QuotationTable;
