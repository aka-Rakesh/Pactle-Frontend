import React from 'react';

export const AuditSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <ol className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="rounded-lg border border-slate-200 p-3 bg-white animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
          <div className="h-3 w-3/4 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </li>
      ))}
    </ol>
  );
};

export default AuditSkeleton;
