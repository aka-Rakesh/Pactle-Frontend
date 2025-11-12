import React, { useState, useRef, useEffect } from "react";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "/logo-white.svg";
import { useAuthStore } from "../../stores";
import { useClientConfig } from "../../hooks/useClientConfig";
import { usePermissions } from "../../hooks/usePermissions";
import type { SidebarProps } from "../../types/common";
import { sidebarMenuItems} from "../../constants/sidebarMenu";

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuthStore();
  const { features } = useClientConfig();
  const { canAccessPage } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPopover, setShowPopover] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActuallyCollapsed = isMobile ? false : isCollapsed;
  const sidebarClasses = `
    ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative"}
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
    ${isMobile ? "w-80 max-w-[85vw] shadow-xl" : isActuallyCollapsed ? "w-16" : "w-64"}
    bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col overflow-hidden
  `;

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/36 z-40" onClick={onClose} />
      )}
      <div className={sidebarClasses} style={{ pointerEvents: 'auto' }}>
        <div className={"px-4 py-4 bg-background-light border-b border-border-dark overflow-visible sticky top-0 z-50"} style={{ pointerEvents: 'auto' }}>
          <div
            className={`flex items-center justify-between ${
              isActuallyCollapsed ? "flex-col-reverse gap-2" : ""
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-icon rounded-lg flex items-center justify-center">
                <img src={logo} alt="Pactle" className="w-4 h-4" />
              </div>
              {(!isActuallyCollapsed || isMobile) && (
                <div>
                  <h1 className="font-semibold text-green-icon text-base">
                    Pactle
                  </h1>
                  <p className="text-xs text-gray-light">
                    Post-sales automation
                  </p>
                </div>
              )}
            </div>
            {isMobile ? (
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-hover-light"
                aria-label="Close menu"
              >
                <IconX className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={onToggleCollapse} 
                className={`p-2 rounded bg-background-dark cursor-pointer transition-colors relative min-w-[32px] min-h-[32px] flex items-center justify-center ${
                  isActuallyCollapsed ? "ml-1" : ""
                }`}
                style={{ 
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }}
                aria-label={isActuallyCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isActuallyCollapsed ? (
                  <IconLayoutSidebarLeftExpand className="w-4 h-4" />
                ) : (
                  <IconLayoutSidebarLeftCollapse className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 bg-background-light overflow-y-auto">
          <div className={`${isActuallyCollapsed ? "px-3 py-3" : "px-4 py-3"} border-b border-border-dark`}>
            {sidebarMenuItems
              .filter((item) => {
                switch (item.id) {
                  case 'overview':
                    return features.showQuotations && canAccessPage('dashboard_overview');
                  case 'raw-material-sheet':
                    return features.showRawMaterials && canAccessPage('raw_material_sheet');
                  case 'sku-list':
                    return features.showSkuList && canAccessPage('sku_list');
                  case 'members':
                    return features.showMembers && canAccessPage('members');
                  default:
                    return false;
                }
              })
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) => {
                      const isOverviewActive = item.id === 'overview' && location.pathname === '/dashboard';
                      
                      return `flex items-center ${isCollapsed ? "justify-center px-2 py-2" : "space-x-3 px-2 py-2"} rounded-md text-sm font-medium transition-colors ${
                        (item.id === 'overview' ? isOverviewActive : isActive)
                          ? "bg-green-darkest text-white"
                          : "text-gray-light hover:bg-hover-light"
                      }`;
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {(!isActuallyCollapsed || isMobile) && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
          </div>

        </nav>

        <div className={`${isActuallyCollapsed ? "p-2" : "p-4"} bg-background-light border-t border-border-dark pb-[max(env(safe-area-inset-bottom),16px)] relative`} ref={profileRef}>
          <div
            onClick={() => setShowPopover((prev) => !prev)}
            className={`cursor-pointer flex items-center ${isActuallyCollapsed ? "justify-center" : "space-x-3 w-full"} ${
              isActuallyCollapsed
                ? ""
                : "bg-background-dark p-4 rounded-lg border border-border-dark"
            }`}
          >
            <div className={`${isActuallyCollapsed ? "w-10 h-10" : "w-8 h-8"} bg-blue-darkest rounded-lg flex items-center justify-center`}>
              <span className="text-white text-sm font-medium">
                {(user?.profile_photo || user?.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            {(!isActuallyCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-dark truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-light truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Popover */}
          {showPopover && (
            <div
              className={`absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-1 ${
                isActuallyCollapsed
                  ? "bottom-[calc(100%+8px)] left-2 right-2"
                  : "bottom-[calc(100%+10px)] left-4 right-4"
              }`}
            >
              <button
                onClick={() => navigate("/dashboard/profile")}
                className="flex gap-2 w-full text-left px-2 py-2 text-sm text-pink-darkest hover:bg-pink-lightest rounded cursor-pointer"
              >
                <IconUser className="w-5 h-5 flex-shrink-0" />
                {(!isActuallyCollapsed || isMobile) && <span>Profile</span>}
              </button>
              <button
                onClick={handleLogout}
                className="flex gap-2 w-full text-left px-2 py-2 text-sm text-pink-darkest hover:bg-pink-lightest rounded cursor-pointer"
              >
                <IconLogout className="w-5 h-5 flex-shrink-0" />
                {(!isActuallyCollapsed || isMobile) && <span>Logout</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
