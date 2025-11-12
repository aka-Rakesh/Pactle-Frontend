import React from 'react';
import { IconBell } from '@tabler/icons-react';
import AlertCard from './AlertCard';
import { useDashboardStore } from '../../stores';

const AlertsPanel: React.FC = () => {
  const { alerts } = useDashboardStore();

  return (
    <div className="bg-white py-4 overflow-hidden max-h-[660px] overflow-y-auto">
      <h3 className="text-xl font-semibold text-gray-dark mb-4">Alerts</h3>
      <div className="space-y-6">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAction={() => console.log(`Action clicked for ${alert.id}`)}
              onClose={() => console.log(`Alert ${alert.id} closed`)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <IconBell className="w-8 h-8 text-gray-light mx-auto mb-2" />
            <p className="text-sm text-gray-light">No alerts at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;