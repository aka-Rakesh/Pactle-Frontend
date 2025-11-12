import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeactivateMember,
  useActivateMember,
  useResendInvitation,
} from "../../hooks";
import {
  IconPencil,
  IconTrash,
  IconUserPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconMail,
  IconCheck,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from "@tabler/icons-react";
import { Button } from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Input } from "../../components/ui/Input";
import { Dropdown } from "../../components/ui/DropDown";
import { Tooltip } from "../../components/ui/Tooltip";
import { useNavigate } from "react-router-dom";
import type {
  CreateMemberRequest,
  UpdateMemberRequest,
  Member,
  MembersQueryParams,
} from "../../types/common";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { AddMemberModal } from "../../components/modal/AddMembersModal";
import { useClientConfig } from "../../hooks/useClientConfig";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthStore } from "../../stores";

interface RoleDropdownProps {
  roles: Array<{ id: string; name: string; color: string; access: string }>;
  selectedRoleId: string;
  onRoleChange: (roleId: string) => void;
  disabled?: boolean;
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({
  roles,
  selectedRoleId,
  onRoleChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all duration-200 hover:opacity-90 whitespace-nowrap max-w-full ${
          selectedRole?.color || "bg-gray-500"
        }`}
        disabled={disabled}
      >
        <span className="truncate max-w-[10rem] sm:max-w-none">
          {selectedRole?.name || "Select Role"}
        </span>
        <IconChevronDown
          size={14}
          className={`ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg z-10 min-w-40 max-h-60 overflow-y-auto">
          {roles.length > 0 ? (
            roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  onRoleChange(role.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-gray-dark hover:bg-gray-100 focus:bg-gray-100 flex items-center justify-between text-left transition-colors duration-150"
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${role.color}`}
                  ></div>
                  {role.name}
                </div>
                {selectedRoleId === role.id && (
                  <IconCheck size={16} className="text-green-default" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-light text-center">
              No roles available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MembersPage: React.FC = () => {
  const [filters, setFilters] = useState<MembersQueryParams>({});
  const { data: membersData, error } = useMembers(filters);
  const createMemberMutation = useCreateMember();
  const updateMemberMutation = useUpdateMember();
  const deactivateMemberMutation = useDeactivateMember();
  const activateMemberMutation = useActivateMember();
  const resendInvitationMutation = useResendInvitation();
  const { roles: configuredRoles } = useClientConfig();
  const { can, canAccessPage, roles: myRoleIds } = usePermissions();
  const { user: currentUser } = useAuthStore();

  const members = useMemo(() => membersData?.users || [], [membersData]);

  const roles = useMemo(() => configuredRoles, [configuredRoles]);
  const isCurrentSuperAdmin = useMemo(
    () => (myRoleIds || []).includes("super_admin"),
    [myRoleIds]
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [pendingDeleteMemberId, setPendingDeleteMemberId] = useState<
    number | null
  >(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
  const [selectedRole, setSelectedRole] = useState(filters.job_title || "");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canAccessPage("members")) {
      navigate("/dashboard", { replace: true });
    }
  }, [canAccessPage, navigate]);

  // Update search term when filters change
  useEffect(() => {
    setSearchTerm(filters.search || "");
    setSelectedStatus(filters.status || "");
    setSelectedRole(filters.job_title || "");
  }, [filters]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const debouncedSearch = (searchValue: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = {
        ...filters,
        search: searchValue.trim() || undefined,
        status: selectedStatus as
          | "ACTIVE"
          | "INACTIVE"
          | "PENDING"
          | "SUSPENDED"
          | undefined,
        job_title: selectedRole || undefined,
      };
      setFilters(newFilters);
    }, 300); // 300ms delay
  };

  const handleAddMember = async (memberData: CreateMemberRequest) => {
    setIsAddingMember(true);
    try {
      await createMemberMutation.mutateAsync(memberData);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleUpdateMember = async (
    memberId: number,
    memberData: UpdateMemberRequest
  ) => {
    setIsUpdatingMember(true);
    try {
      await updateMemberMutation.mutateAsync({ memberId, updates: memberData });
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleEditMember = useCallback((member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  }, []);

  const handleDeactivateMember = useCallback((memberId: number) => {
    setPendingDeleteMemberId(memberId);
    setIsDeleteOpen(true);
  }, []);

  const confirmDeactivateMember = useCallback(async () => {
    if (pendingDeleteMemberId == null) return;
    try {
      await deactivateMemberMutation.mutateAsync(pendingDeleteMemberId);
    } catch (error) {
      console.error("Failed to deactivate member:", error);
    } finally {
      setIsDeleteOpen(false);
      setPendingDeleteMemberId(null);
    }
  }, [pendingDeleteMemberId, deactivateMemberMutation]);

  const handleActivateMember = useCallback(
    async (memberId: number) => {
      try {
        await activateMemberMutation.mutateAsync(memberId);
      } catch (error) {
        console.error("Failed to activate member:", error);
      }
    },
    [activateMemberMutation]
  );

  const handleResendInvitation = useCallback(
    async (memberId: number) => {
      try {
        await resendInvitationMutation.mutateAsync(memberId);
      } catch (error) {
        console.error("Failed to resend invitation:", error);
      }
    },
    [resendInvitationMutation]
  );

  const handleContinue = () => {
    navigate("/dashboard", { replace: true });
  };

  const processedMembers = useMemo(() => {
    return members.map((member) => {
      const nameParts = member.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      return {
        ...member,
        firstName,
        lastName,
        fullName: member.name,
      };
    });
  }, [members]);

  const columnHelper = createColumnHelper<(typeof processedMembers)[0]>();

  function isTargetSuperAdminMember(
    target: (typeof processedMembers)[0]
  ): boolean {
    const targetRoleName = (
      target.role?.name ||
      target.job_title ||
      ""
    ).toLowerCase();
    return targetRoleName.includes("super admin");
  }

  function canUpdateMember(target: (typeof processedMembers)[0]): boolean {
    const targetIsSuperAdmin = isTargetSuperAdminMember(target);
    const isSelf = Boolean(
      currentUser && target?.id === (currentUser as any)?.id
    );
    const effectiveIsSuperAdmin =
      isCurrentSuperAdmin || (isSelf && targetIsSuperAdmin);
    if (targetIsSuperAdmin) {
      return (
        can("members.update") &&
        can("members.modify_super_admin") &&
        effectiveIsSuperAdmin
      );
    }
    return can("members.update");
  }

  function canDeactivateMember(target: (typeof processedMembers)[0]): boolean {
    const targetIsSuperAdmin = isTargetSuperAdminMember(target);
    if (targetIsSuperAdmin) {
      return (
        can("members.deactivate") &&
        can("members.modify_super_admin") &&
        isCurrentSuperAdmin
      );
    }
    return can("members.deactivate");
  }

  function canActivateMember(target: (typeof processedMembers)[0]): boolean {
    const targetIsSuperAdmin = isTargetSuperAdminMember(target);
    if (targetIsSuperAdmin) {
      return (
        can("members.activate") &&
        can("members.modify_super_admin") &&
        isCurrentSuperAdmin
      );
    }
    return can("members.activate");
  }

  const columns = useMemo<ColumnDef<(typeof processedMembers)[0], any>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <input type="checkbox" className="h-4 w-4" aria-label="Select all" />
        ),
        cell: () => (
          <input type="checkbox" className="h-4 w-4" aria-label="Select row" />
        ),
      }),
      // Full name
      columnHelper.accessor("fullName", {
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Full name</span>
            <button
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="p-1 hover:bg-gray-100 rounded"
            >
              {column.getIsSorted() === "asc" ? (
                <IconChevronUp size={14} />
              ) : column.getIsSorted() === "desc" ? (
                <IconChevronDown size={14} />
              ) : (
                <IconSelector size={14} />
              )}
            </button>
          </div>
        ),
        cell: (info) => (
          <div>
            <div className="font-medium text-sm">{info.getValue()}</div>
            <div className="text-xs text-gray-light hidden sm:block break-all">
              {info.row.original.email}
            </div>
          </div>
        ),
      }),
      // Role
      columnHelper.display({
        id: "role",
        header: () => <div className="hidden sm:block">Role</div>,
        cell: ({ row }) => {
          const currentRole = roles.find(
            (role) => role.name === row.original.job_title
          );
          const selectedRoleId =
            currentRole?.id ||
            row.original.job_title?.toLowerCase().replace(/\s+/g, "_") ||
            "";
          const isTargetSuperAdmin = isTargetSuperAdminMember(row.original);

          return (
            <div className="hidden sm:flex items-center">
              <RoleDropdown
                roles={roles}
                selectedRoleId={selectedRoleId}
                onRoleChange={async (roleId) => {
                  try {
                    const selectedRole = roles.find(
                      (role) => role.id === roleId
                    );
                    if (selectedRole) {
                      const target = row.original;
                      if (!canUpdateMember(target)) return;
                      await updateMemberMutation.mutateAsync({
                        memberId: row.original.id,
                        updates: { job_title: selectedRole.name },
                      });
                    }
                  } catch (e) {
                    console.error("Failed to update role", e);
                  }
                }}
                disabled={
                  isTargetSuperAdmin
                    ? !canUpdateMember(row.original)
                    : !canUpdateMember(row.original)
                }
              />
            </div>
          );
        },
      }),
      // Access text
      columnHelper.display({
        id: "access_text",
        header: () => <div className="hidden md:block">Access</div>,
        cell: ({ row }) => {
          const selectedRole = roles.find(
            (r: any) => r.name === row.original.job_title
          );
          const accessText =
            selectedRole?.access || deriveAccessText(row.original);
          return (
            <div className="hidden md:block text-xs sm:text-sm text-gray-dark">
              {accessText}
            </div>
          );
        },
      }),
      // Phone number
      columnHelper.accessor("phone", {
        header: () => <div className="hidden lg:block">Phone number</div>,
        cell: (info) => (
          <div className="hidden lg:block">{info.getValue() || "-"}</div>
        ),
      }),
      // Email
      columnHelper.accessor("email", {
        header: () => <div className="hidden lg:block">Email</div>,
        cell: (info) => (
          <div className="hidden lg:block">{info.getValue()}</div>
        ),
      }),
      // Region
      columnHelper.display({
        id: "region",
        header: () => <div className="hidden xl:block">Region</div>,
        cell: () => <div className="hidden xl:block">-</div>,
      }),
      // Actions
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            {/* Mobile: Dropdown menu */}
            <div className="sm:hidden relative">
              <Dropdown
                options={[
                  ...(canUpdateMember(row.original)
                    ? [{ label: "Edit", value: "edit" }]
                    : []),
                  ...(row.original.status === "PENDING"
                    ? [{ label: "Resend invitation", value: "resend" }]
                    : []),
                  ...(canDeactivateMember(row.original)
                    ? [{ label: "Deactivate", value: "deactivate" }]
                    : []),
                  ...(canActivateMember(row.original)
                    ? [{ label: "Activate", value: "activate" }]
                    : []),
                ]}
                selected=""
                onChange={(value) => {
                  switch (value) {
                    case "edit":
                      handleEditMember(row.original);
                      break;
                    case "resend":
                      handleResendInvitation(row.original.id);
                      break;
                    case "deactivate":
                      if (canDeactivateMember(row.original))
                        handleDeactivateMember(row.original.id);
                      break;
                    case "activate":
                      if (canActivateMember(row.original))
                        handleActivateMember(row.original.id);
                      break;
                  }
                }}
                width="auto"
                className="min-w-40"
              />
            </div>

            {/* Desktop: Individual buttons */}
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
              <Tooltip content="Edit member">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditMember(row.original)}
                  disabled={!canUpdateMember(row.original)}
                  className="p-1 sm:p-2"
                >
                  <IconPencil size={14} className="sm:w-4 sm:h-4" />
                </Button>
              </Tooltip>

              {row.original.status === "PENDING" && (
                <Tooltip content="Resend invitation">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvitation(row.original.id)}
                    className="p-1 sm:p-2"
                  >
                    <IconMail size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                </Tooltip>
              )}

              <Tooltip
                content={
                  canDeactivateMember(row.original)
                    ? "Deactivate member"
                    : "You don't have permission"
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeactivateMember(row.original.id)}
                  disabled={!canDeactivateMember(row.original)}
                  className="p-1 sm:p-2"
                >
                  <IconTrash size={14} className="sm:w-4 sm:h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        ),
      }),
    ],
    [
      handleEditMember,
      handleResendInvitation,
      handleDeactivateMember,
      handleActivateMember,
      columnHelper,
    ]
  );

  function deriveAccessText(member: (typeof processedMembers)[0]): string {
    const roleName = member.role?.name?.toLowerCase?.() || "";
    if (roleName.includes("super admin"))
      return "View, comment, approve, manage";
    if (roleName.includes("admin")) return "View, comment, approve";
    if (roleName.includes("rm manager")) return "Edit RM sheet";
    return "View";
  }

  const table = useReactTable({
    data: processedMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  });

  const roleFilterOptions = [
    { label: "All Roles", value: "" },
    ...roles.map((role: any) => ({ label: role.name, value: role.name })),
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm">
            {error.message}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-border-dark overflow-hidden shadow-sm">
          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-border-dark bg-background-light">
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-4">
              {/* Search bar */}
              <div className="relative">
                <IconSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light z-10"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="Search team members"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  variant="search"
                  className="w-full"
                />
              </div>

              {/* Mobile Filters and Add Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-light py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span>Filters</span>
                  {showFilters ? (
                    <IconChevronUp size={16} />
                  ) : (
                    <IconChevronDown size={16} />
                  )}
                </button>

                {can("members.create") && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="default"
                    className="px-4 py-2 text-sm"
                  >
                    <IconUserPlus size={16} />
                    <span className="ml-2">Add member</span>
                  </Button>
                )}
              </div>

              {/* Collapsible Filters */}
              {showFilters && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  {roleFilterOptions.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Role
                      </label>
                      <Dropdown
                        options={roleFilterOptions}
                        selected={selectedRole}
                        onChange={(value) => {
                          setSelectedRole(value.toString());
                          setTimeout(() => {
                            const newFilters = {
                              ...filters,
                              search: searchTerm.trim() || undefined,
                              status: (selectedStatus || undefined) as
                                | "ACTIVE"
                                | "INACTIVE"
                                | "PENDING"
                                | "SUSPENDED"
                                | undefined,
                              job_title: value.toString() || undefined,
                            };
                            setFilters(newFilters);
                          }, 0);
                        }}
                        width="full"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex justify-between items-center gap-4">
              {/* Search bar */}
              <div className="relative flex-1 min-w-0 max-w-md">
                <IconSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-light z-10"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="Search team members"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  variant="search"
                />
              </div>

              <div className="flex gap-3 items-center">
                {roleFilterOptions.length > 1 && (
                  <Dropdown
                    options={roleFilterOptions}
                    selected={selectedRole}
                    onChange={(value) => {
                      setSelectedRole(value.toString());
                      setTimeout(() => {
                        const newFilters = {
                          ...filters,
                          search: searchTerm.trim() || undefined,
                          status: (selectedStatus || undefined) as
                            | "ACTIVE"
                            | "INACTIVE"
                            | "PENDING"
                            | "SUSPENDED"
                            | undefined,
                          job_title: value.toString() || undefined,
                        };
                        setFilters(newFilters);
                      }, 0);
                    }}
                    width="auto"
                  />
                )}

                {can("members.create") && (
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="default"
                  >
                    <IconUserPlus size={16} />
                    Add team member
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table/Cards */}
          {processedMembers.length === 0 ? (
            <div className="p-6 sm:p-8 text-center bg-background-light">
              <div
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white flex flex-col items-center cursor-pointer p-6 sm:p-8 rounded-lg transition-all duration-200 text-gray-light hover:text-gray-dark border border-border-dark hover:shadow-md mx-auto"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background-lightest rounded-lg flex items-center justify-center mb-4">
                  <IconUserPlus className="text-artichoke" size={24} />
                </div>
                <p className="font-medium mb-2 text-sm sm:text-base text-center">
                  Add your first team member
                </p>
                <p className="text-xs text-gray-light text-center">
                  Click here to get started
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="sm:hidden divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => {
                  const member = row.original;
                  const currentRole = roles.find(
                    (role) => role.name === member.job_title
                  );
                  const selectedRoleId =
                    currentRole?.id ||
                    member.job_title?.toLowerCase().replace(/\s+/g, "_") ||
                    "";
                  const isTargetSuperAdmin = (
                    member.role?.name ||
                    member.job_title ||
                    ""
                  )
                    .toLowerCase()
                    .includes("super admin");

                  return (
                    <div
                      key={row.id}
                      className="p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="font-medium text-sm text-gray-dark mb-1">
                            {member.fullName}
                          </div>
                          <div className="text-xs text-gray-light mb-2">
                            {member.email}
                          </div>
                          {member.job_title && (
                            <div className="flex items-center mb-2">
                              <RoleDropdown
                                roles={roles}
                                selectedRoleId={selectedRoleId}
                                disabled={
                                  isTargetSuperAdmin
                                    ? !canUpdateMember(member)
                                    : !canUpdateMember(member)
                                }
                                onRoleChange={async (roleId) => {
                                  try {
                                    const selectedRole = roles.find(
                                      (role) => role.id === roleId
                                    );
                                    const target = member;
                                    if (!canUpdateMember(target)) return;
                                    if (selectedRole) {
                                      await updateMemberMutation.mutateAsync({
                                        memberId: member.id,
                                        updates: {
                                          job_title: selectedRole.name,
                                        },
                                      });
                                    }
                                  } catch (e) {
                                    console.error("Failed to update role", e);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Dropdown
                            options={[
                              { label: "Edit", value: "edit" },
                              ...(member.status === "PENDING"
                                ? [
                                    {
                                      label: "Resend invitation",
                                      value: "resend",
                                    },
                                  ]
                                : []),
                              ...(member.is_admin
                                ? []
                                : [
                                    {
                                      label: "Deactivate",
                                      value: "deactivate",
                                    },
                                    { label: "Activate", value: "activate" },
                                  ]),
                            ]}
                            selected=""
                            onChange={(value) => {
                              switch (value) {
                                case "edit":
                                  handleEditMember(member);
                                  break;
                                case "resend":
                                  handleResendInvitation(member.id);
                                  break;
                                case "deactivate":
                                  handleDeactivateMember(member.id);
                                  break;
                                case "activate":
                                  handleActivateMember(member.id);
                                  break;
                              }
                            }}
                            width="auto"
                            className="min-w-32"
                          />
                        </div>

                        <ConfirmModal
                          isOpen={isDeleteOpen}
                          title="Are you sure you want to delete this member?"
                          description="This action cannot be undone. This will permanently delete this person's account and data from our servers."
                          confirmText="Delete"
                          cancelText="Cancel"
                          confirmVariant="danger"
                          onConfirm={confirmDeactivateMember}
                          onCancel={() => {
                            setIsDeleteOpen(false);
                            setPendingDeleteMemberId(null);
                          }}
                          isConfirmLoading={
                            deactivateMemberMutation.isPending as unknown as boolean
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto bg-background-light p-3 sm:p-6">
                <div className="bg-white border border-border-dark min-w-fit">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-border-dark">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="text-left px-3 sm:px-6 py-2 sm:py-3 text-xs font-medium text-gray-light uppercase tracking-wider"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-dark"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {/* Pagination */}
          {processedMembers.length > 0 && (
            <div className="bg-background-light border-t border-border-dark px-4 py-4 sm:px-6 sm:py-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <span className="text-sm text-gray-dark">
                    <span className="hidden sm:inline">Total </span>
                    {processedMembers.length}
                    <span className="hidden sm:inline"> Members</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    variant="back"
                    size="sm"
                    className="p-2 sm:p-2"
                  >
                    <IconChevronLeft size={16} />
                  </Button>

                  <span className="flex items-center gap-1 text-sm">
                    <span className="hidden sm:inline">Page </span>
                    <span className="font-medium">
                      {table.getState().pagination.pageIndex + 1}
                    </span>
                    <span className="text-gray-light">of</span>
                    <span className="font-medium">{table.getPageCount()}</span>
                  </span>

                  <Button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    variant="back"
                    size="sm"
                    className="p-2 sm:p-2"
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center sm:justify-end p-4 sm:p-6 bg-background-light border border-border-dark rounded-lg sticky bottom-0 z-10 shadow-lg sm:shadow-none">
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium"
            variant="default"
          >
            Save & Continue
          </Button>
        </div>

        {/* Add/Edit Member Modal */}
        <AddMemberModal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setEditingMember(null);
          }}
          onAdd={handleAddMember}
          onUpdate={handleUpdateMember}
          isLoading={isAddingMember || isUpdatingMember}
          member={editingMember}
        />
      </div>
    </div>
  );
};

export default MembersPage;
