import React, { useState, useEffect } from 'react';
import { IconBrandHipchat } from '@tabler/icons-react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useClientConfig } from '../../hooks/useClientConfig';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { features } = useClientConfig();
  const openChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pactle:open-help-chat'));
    }
  };

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

      {features.showHelpSupport && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 w-20 h-20 rounded-[16px] bg-green-darkest text-white shadow-lg flex items-center justify-center hover:bg-green-dark"
          aria-label="Open chat"
        >
          <IconBrandHipchat className="w-10 h-10" />
        </button>
      )}
    </div>
  );
};

export default DashboardLayout;