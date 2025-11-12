import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useClientConfig } from '../../hooks/useClientConfig';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { features } = useClientConfig();

  const getActiveTab = () => {
    const pathSegments = location.pathname.split('/');
    const dashboardIndex = pathSegments.indexOf('dashboard');
    
    if (dashboardIndex === -1) return 'overview';
    
    const activeSegment = pathSegments[dashboardIndex + 1];
    
    if (!activeSegment) return 'overview';
    
    return activeSegment;
  };

  const activeTab = getActiveTab();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  }, [isMobile, sidebarCollapsed]);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  return (
    <div className="flex h-screen bg-white">
      {features.showSidebar && (
        <Sidebar
          key={isMobile ? 'mobile' : 'desktop'}
          activeTab={activeTab}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {features.showHeader && (
          <Header
            activeTab={activeTab}
            isMobile={isMobile}
            onMenuClick={handleMenuClick}
            showSearch={features.showSearch}
            notificationCount={features.showNotifications ? 1 : 0}
          />
        )}
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;