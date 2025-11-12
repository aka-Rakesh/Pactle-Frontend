import { useMemo } from "react";
import { useAuthStore } from "../stores";
import { useClientConfig } from "./useClientConfig";

type PermissionKey = string;
type PageKey = string;

function normalizeRoleId(input?: string | null): string | null {
  if (!input) return null;
  const v = String(input).trim().toLowerCase();
  if (!v) return null;
  if (v.includes("super admin")) return "super_admin";
  if (v === "admin") return "admin";
  if (v.includes("rm manager") || v.includes("raw material")) return "rm_manager";
  if (v.includes("sales")) return "salesperson";
  return v;
}

function userRoleIds(user: any): string[] {
  const ids: string[] = [];
  const jobTitleId = normalizeRoleId(user?.job_title);
  const roleNameId = normalizeRoleId(user?.role);
  if (jobTitleId) ids.push(jobTitleId);
  if (roleNameId && roleNameId !== jobTitleId) ids.push(roleNameId);
  return Array.from(new Set(ids));
}

function isAuthenticated(user: any): boolean {
  return !!user;
}

export function usePermissions() {
  const { user, isAuthenticated: authed } = useAuthStore();
  const { permissions } = useClientConfig();

  const roles = useMemo(() => userRoleIds(user), [user]);

  const checkAllowed = (allowed: string[] | undefined): boolean => {
    if (!allowed || allowed.length === 0) return false;
    if (allowed.includes("authenticated")) return authed && isAuthenticated(user);
    return allowed.some((req) => roles.includes(req));
  };

  const can = (action: PermissionKey): boolean => {
    const allowed = permissions?.actions?.[action];
    return checkAllowed(allowed);
  };

  const canAccessPage = (page: PageKey): boolean => {
    const allowed = permissions?.pages?.[page];
    return checkAllowed(allowed);
  };

  return {
    can,
    canAccessPage,
    roles,
  };
}


