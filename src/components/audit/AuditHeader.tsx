import React from 'react';
import { t } from '../../lib/i18n';

const AuditHeader: React.FC<{ total?: number; onClose?: () => void }> = ({ total, onClose }) => {
  return (
    <div className="flex items-center justify-between">
      <h3 
        className="text-gray-900" 
        style={{ 
          fontFamily: 'Inter, sans-serif', 
          fontWeight: 600, 
          fontSize: '14px', 
          lineHeight: '28px', 
          letterSpacing: '-0.5%' 
        }}
      >
        {t('audit.title')}
      </h3>
      {onClose && (
        <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AuditHeader;
