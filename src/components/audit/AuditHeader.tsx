import React from 'react';
import { t } from '../../lib/i18n';
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-react';

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
        <button onClick={onClose} aria-label="Close" className="p-1">
          <IconLayoutSidebarRightCollapse className="w-5 h-5" style={{ color: '#767579' }} />
        </button>
      )}
    </div>
  );
};

export default AuditHeader;
