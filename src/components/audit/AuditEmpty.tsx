import React from 'react';
import { t } from '../../lib/i18n';

const AuditEmpty: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="text-center py-8 text-sm text-gray-500">
      {message || t('audit.empty')}
    </div>
  );
};

export default AuditEmpty;
