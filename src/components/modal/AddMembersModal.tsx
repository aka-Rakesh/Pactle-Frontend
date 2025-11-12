import React, { useState, useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import { Dropdown } from "../../components/ui/DropDown";
import { validateEmailFormat } from "../../utils/invitationSecurity";
import type {
  AddMemberModalProps,
  CreateMemberRequest,
  UpdateMemberRequest,
} from "../../types/common";
import { usePermissions } from "../../hooks/usePermissions";
import { useClientConfig } from "../../hooks/useClientConfig";

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  isLoading,
  member = null,
}) => {
  const { can } = usePermissions();
  const [availableRoles, setAvailableRoles] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    job_title: "",
    phone: "",
    role_id: "",
    access_level: "View Only" as "View Only" | "Edit Both" | "Edit Quotation",
  });
  const [error, setError] = useState("");

  const { roles: configuredRoles } = useClientConfig();
  useEffect(() => {
    try {
      const canModifySuper = can("members.modify_super_admin");
      const normalized = (configuredRoles || [])
        .filter((r: any) => canModifySuper || r.id !== "super_admin")
        .map((r: any) => ({
          id: r.id,
          name: r.name,
        }));
      setAvailableRoles(normalized);
    } catch (error) {
      console.error("Failed to load roles from config:", error);
    }
  }, [configuredRoles]);

  useEffect(() => {
    if (member) {
      setFormData({
        email: member.email || "",
        name: member.name || "",
        job_title: member.job_title || "",
        phone: member.phone || "",
        role_id: member.role?.id?.toString() || "",
        access_level: member.access_level || "View Only",
      });
    } else {
      setFormData({
        email: "",
        name: "",
        job_title: "",
        phone: "",
        role_id: "",
        access_level: "View Only",
      });
    }
  }, [member]);

  const handleSubmit = async () => {
    const isEditing = Boolean(member);
    const targetIsSuperAdmin = (member?.role?.name || member?.job_title || "")
      .toLowerCase()
      .includes("super admin");
    const hasCreatePermission = can("members.create");
    const hasUpdatePermission = can("members.update");
    const hasModifySuperAdmin = can("members.modify_super_admin");

    if (!isEditing && !hasCreatePermission) {
      setError("You don't have permission to add members");
      return;
    }

    if (isEditing) {
      if (!hasUpdatePermission) {
        setError("You don't have permission to update members");
        return;
      }
      if (targetIsSuperAdmin && !hasModifySuperAdmin) {
        setError("You don't have permission to modify a Super Admin");
        return;
      }
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmailFormat(formData.email)) {
      setError("Enter a valid email address");
      return;
    }

    try {
      if (member && onUpdate) {
        const updateData: UpdateMemberRequest = {};

        if (formData.name.trim() !== member.name) {
          updateData.name = formData.name.trim();
        }
        if (formData.job_title.trim() !== member.job_title) {
          if (targetIsSuperAdmin && !hasModifySuperAdmin) {
            setError("You don't have permission to modify a Super Admin");
            return;
          }
          updateData.job_title = formData.job_title.trim();
        }
        if (formData.phone.trim() !== member.phone) {
          updateData.phone = formData.phone.trim();
        }
        if (formData.role_id !== member.role?.id?.toString()) {
          updateData.role_id = formData.role_id
            ? Number(formData.role_id)
            : undefined;
        }
        if (formData.access_level !== member.access_level) {
          updateData.access_level = formData.access_level;
          updateData.is_admin = formData.access_level === "Edit Both";
        }

        await onUpdate(member.id, updateData);
      } else {
        const memberData: CreateMemberRequest = {
          email: formData.email.trim(),
          name: formData.name.trim(),
          job_title: formData.job_title.trim(),
          phone: formData.phone.trim(),
          role_id: formData.role_id ? Number(formData.role_id) : undefined,
          access_level: formData.access_level,
          is_admin: formData.access_level === "Edit Both",
        };

        await onAdd(memberData);
      }

      setFormData({
        email: "",
        name: "",
        job_title: "",
        phone: "",
        role_id: "",
        access_level: "View Only",
      });
      setError("");
      onClose();
    } catch (err) {
      console.error("Failed to add/update member:", err);
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      if (error) setError("");
    };

  const jobTitleOptions = React.useMemo(() => {
    return (availableRoles || []).map((role) => ({
      label: role.name,
      value: role.name,
    }));
  }, [availableRoles]);

  const accessLevelOptions = [
    { label: "View Only", value: "View Only" },
    { label: "Edit Both", value: "Edit Both" },
  ];

  if (!isOpen) return null;

  const isEditing = Boolean(member);
  const targetIsSuperAdmin = (member?.role?.name || member?.job_title || "")
    .toLowerCase()
    .includes("super admin");
  const hasCreatePermission = can("members.create");
  const hasUpdatePermission = can("members.update");
  const hasModifySuperAdmin = can("members.modify_super_admin");
  const canEditThisMember = isEditing
    ? hasUpdatePermission && (!targetIsSuperAdmin || hasModifySuperAdmin)
    : hasCreatePermission;

  return (
    <div className="fixed inset-0 bg-black/36 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-lg p-4 w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-dark">
            {member ? "Edit team member" : "Add a team member"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-light hover:text-gray-dark"
            disabled={isLoading}
          >
            <IconX size={20} />
          </button>
        </div>

        <p className="text-gray-light text-sm mb-6">
          Fill in the details to {member ? "update" : "add"} a team member.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Input
              type="email"
              label="Email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleInputChange("email")}
              disabled={isLoading || !!member}
            />
          </div>

          <div>
            <Input
              type="text"
              label="Name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleInputChange("name")}
              disabled={isLoading}
            />
          </div>

          <div>
            <Dropdown
              label="Job Title"
              options={[
                { label: "Select Job Title", value: "" },
                ...jobTitleOptions,
              ]}
              selected={formData.job_title}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  job_title: value.toString(),
                }))
              }
              disabled={Boolean(
                isEditing &&
                  (!canEditThisMember ||
                    (targetIsSuperAdmin && !hasModifySuperAdmin))
              )}
            />
          </div>

          <div>
            <PhoneInput
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, phone: val }))
              }
              disabled={isLoading}
              maxDigits={10}
            />
          </div>

          <div>
            <Dropdown
              label="Access Level"
              options={accessLevelOptions}
              selected={formData.access_level}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, access_level: value as any }))
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !canEditThisMember}
              className="flex-1"
            >
              {isLoading
                ? member
                  ? "Updating..."
                  : "Adding..."
                : member
                ? "Update member"
                : "Add member"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
