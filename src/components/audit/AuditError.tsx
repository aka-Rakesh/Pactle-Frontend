import React from 'react';
import { t } from '../../lib/i18n';

const AuditError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <div className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
      <span>{t('audit.error')}</span>
      {onRetry && (
        <button onClick={onRetry} className="px-2 py-1 text-rose-700 hover:bg-rose-100 rounded">
          {t('audit.retry')}
        </button>
      )}
    </div>
  );
};

export default AuditError;
