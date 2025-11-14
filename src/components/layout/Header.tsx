import React, { useState, useRef, useEffect } from "react";
import {
  IconMenu,
  IconSearch,
  IconSettings,
  IconUser,
  IconLogout,
  IconLifebuoy,
  IconDownload,
  IconListDetails,
} from "@tabler/icons-react";
import type { HeaderProps } from "../../types/common";
import { useClientConfig } from "../../hooks/useClientConfig";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import PreviewApproveButton from "../quotation/PreviewApproveButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/Breadcrumb";
import { useAuthStore } from "../../stores";
import { usePermissions } from "../../hooks/usePermissions";

const Header: React.FC<HeaderProps> = ({
  activeTab,
  isMobile,
  onMenuClick,
  showSearch = true,
}) => {
  const { features } = useClientConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { canAccessPage } = usePermissions();
  const settingsRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const formatSegment = (segment: string) =>
    segment === "help" 
      ? "Help & Support" 
      : segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatTabTitle = (tab: string) => 
    tab === "help" 
      ? "Help & Support" 
      : tab.replace("-", " ");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    return { label: formatSegment(segment), href };
  });

  const isPreviewPage = location.pathname.includes('/preview');

  return (
    <header className={`px-4 sm:px-8 py-4 sm:py-6 relative ${isPreviewPage ? 'bg-background-light' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-4">
          {isMobile && features.showSidebar && (
            <button
              onClick={onMenuClick}
              className="p-1 text-gray-dark hover:text-gray-dark transition-colors"
              aria-label="Open menu"
            >
              <IconMenu className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-dark capitalize">
              {formatTabTitle(activeTab)}
            </h1>
            <div className="overflow-x-auto whitespace-nowrap no-scrollbar">
              <Breadcrumb>
                <BreadcrumbList>
                {breadcrumbItems.map((item, idx) => {
                  const isLast = idx === breadcrumbItems.length - 1;
                  return (
                    <React.Fragment key={item.href}>
                      <BreadcrumbItem>
                        {idx === 0 &&
                        item.label.toLowerCase() === "dashboard" ? (
                          isLast ? (
                            <BreadcrumbPage>
                              {formatSegment("dashboard")}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to="/dashboard">
                                {formatSegment("dashboard")}
                              </Link>
                            </BreadcrumbLink>
                          )
                        ) : isLast ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.href}>
                              {item.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 self-stretch sm:self-auto w-full sm:w-auto">
          {!isPreviewPage && showSearch && (
            <div className="relative w-full sm:w-auto">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-light" />
              <Input
                type="text"
                variant="searchDark"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          )}
          {isPreviewPage && (
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end w-full sm:w-auto">
              <Button
                onClick={() => {
                  if ((window as any).pactlePreview?.downloadAllBrands) {
                    (window as any).pactlePreview.downloadAllBrands();
                  }
                }}
                variant="close"
                className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center"
                title="Download all brand PDFs"
              >
                <IconDownload className="w-4 h-4" />
                Download All Brands
              </Button>
              <PreviewApproveButton />
            </div>
          )}

          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              className="p-2 bg-green-dark border border-border-dark text-white rounded-full hover:bg-green-icon transition-colors cursor-pointer"
              aria-label="Open settings"
            >
              <IconSettings className="w-5 h-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white z-50 border border-border-dark rounded-md shadow-lg p-1">
                <div className="px-4 py-2 font-semibold text-sm border-b border-gray-200">
                  Settings
                </div>
                <div className="py-1">
                  {features.showProfile && (
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setShowSettingsMenu(false);
                    }}
                    className="flex gap-2 w-full text-left px-3 py-2 text-sm text-pink-darkest hover:bg-background-lightest rounded cursor-pointer"
                  >
                    <IconUser className="w-4 h-4" /> Profile
                  </button>
                  )}
                  {features.showMembers && canAccessPage('members') && (
                    <button
                      onClick={() => {
                        navigate("/dashboard/members");
                        setShowSettingsMenu(false);
                      }}
                      className="flex gap-2 w-full text-left px-3 py-2 text-sm text-pink-darkest hover:bg-background-lightest rounded cursor-pointer"
                    >
                      <IconLifebuoy className="w-4 h-4" /> Members
                    </button>
                  )}
                  {features.showSkuList && canAccessPage('sku_list') && (
                    <button
                      onClick={() => {
                        navigate("/dashboard/sku-list");
                        setShowSettingsMenu(false);
                      }}
                      className="flex gap-2 w-full text-left px-3 py-2 text-sm text-pink-darkest hover:bg-background-lightest rounded cursor-pointer"
                    >
                      <IconListDetails className="w-4 h-4" /> SKU List
                    </button>
                  )}
                </div>
                <div className="border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="flex gap-2 w-full text-left px-3 py-2 text-sm text-pink-darkest hover:bg-pink-lightest rounded cursor-pointer"
                  >
                    <IconLogout className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
