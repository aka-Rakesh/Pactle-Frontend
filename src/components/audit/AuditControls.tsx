import React, { useState } from 'react';
import { useAuditStore } from './auditStore';
import type { AuditEventType } from './AuditTypes';
import { IconFilter } from '@tabler/icons-react';

const TYPES: AuditEventType[] = ['CREATED','EDITED','SENT','VIEWED','APPROVED','SIGNED','COMMENTED','RESTORED','PERMISSION_CHANGED','FAILED'];

const AuditControls: React.FC<{ onClear?: () => void; actors?: string[] }> = () => {
  const { filters, setQuery, setSort, toggleType } = useAuditStore();
  const [q, setQ] = useState(filters.query);
  const [showSortMenu, setShowSortMenu] = useState(false);

  React.useEffect(() => {
    const h = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(h);
  }, [q, setQuery]);

  return (
    <div className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search activity"
        className="flex-1 px-3 py-2 rounded-md text-sm bg-white placeholder:text-gray-400 focus:outline-none"
        aria-label="Search"
      />
      <div className="relative">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="px-3 py-2 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none whitespace-nowrap inline-flex items-center gap-2"
        >
          <IconFilter className="w-4 h-4" style={{ color: '#3F3F46' }} />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0%',
              color: '#3F3F46',
            }}
          >
            Filter
          </span>
          {filters.types.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: '#3F3F46', color: '#C2C2C3' }}
            >
              {filters.types.length}
            </span>
          )}
        </button>
        {showSortMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Sort by</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSort('newest');
                    }}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      filters.sort === 'newest' ? 'text-white border-transparent font-medium' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    style={filters.sort === 'newest' ? { backgroundColor: '#2e4828' } : {}}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => {
                      setSort('oldest');
                    }}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      filters.sort === 'oldest' ? 'text-white border-transparent font-medium' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    style={filters.sort === 'oldest' ? { backgroundColor: '#2e4828' } : {}}
                  >
                    Oldest
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Filter by type</div>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((tp) => {
                    const active = filters.types.includes(tp);
                    return (
                      <button
                        key={tp}
                        onClick={() => toggleType(tp)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          active 
                            ? 'text-gray-900 border border-transparent' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                        }`}
                        style={active ? { backgroundColor: '#B8D3B0' } : {}}
                        aria-pressed={active}
                      >
                        {tp}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditControls;

