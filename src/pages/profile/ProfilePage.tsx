import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores";
import { useUserProfile, useUpdateProfile } from "../../hooks";
import { type ProfileFormData } from "../../types/common";
import { IconX, IconUpload, IconCameraUp } from "@tabler/icons-react";
import { Input } from "../../components/ui/Input";
import PhoneInput from "../../components/ui/PhoneInput";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextArea";
import { Dropdown } from "../../components/ui/DropDown";
import { Loading } from "../../components/ui/Loading";
import { validateEmailFormat } from "../../utils/invitationSecurity";
import { toast } from "sonner";
import { useClientConfig } from "../../hooks/useClientConfig";

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuthStore();
  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAccess, setIsEditingAccess] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    bio: "",
    job_title: "",
    access_level: "",
    phone: "",
    profile_photo: null,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const currentUser = profileData || user;
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        email: formData.email || currentUser.email || "",
        bio: currentUser.bio || "",
        job_title: currentUser.job_title || "",
        access_level: currentUser.access_level || "",
        phone: currentUser.phone || "",
        profile_photo: null,
      });
      const parts = (currentUser.name || "").split(" ");
      setFirstName(parts.slice(0, -1).join(" ") || parts[0] || "");
      setLastName(parts.length > 1 ? parts.slice(-1).join(" ") : "");
    }
  }, [profileData, user]);

  // Check if there are changes in personal section
  const hasPersonalChanges = () => {
    const currentUser = profileData || user;
    if (!currentUser) return false;
    
    const combinedName = `${firstName} ${lastName}`.trim();
    return combinedName !== (currentUser.name || "") || 
           formData.bio !== (currentUser.bio || "");
  };

  // Check if there are changes in contact section
  const hasContactChanges = () => {
    const currentUser = profileData || user;
    if (!currentUser) return false;
    
    return formData.email !== (currentUser.email || "") || 
           formData.phone !== (currentUser.phone || "");
  };

  // Check if there are changes in access section
  const hasAccessChanges = () => {
    const currentUser = profileData || user;
    if (!currentUser) return false;
    
    return formData.job_title !== (currentUser.job_title || "");
  };

  // Check if there are any changes at all
  const hasAnyChanges = () => {
    return hasPersonalChanges() || hasContactChanges() || hasAccessChanges() || selectedUpload;
  };

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnyChanges]);

  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const { roles: configuredRoles } = useClientConfig();
  const jobTitleOptions = React.useMemo(
    () => (configuredRoles || []).map((r: any) => ({ label: r.name, value: r.name })),
    [configuredRoles]
  );

  const normalizedRole = (formData.job_title || user?.job_title || '').toLowerCase();
  const isLockedRole = normalizedRole === 'sales person' || normalizedRole === 'rm manager';

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedUpload(file);
    }
  };

  const handleSubmit = async () => {
    const currentUser = profileData || user;
    if (!currentUser?.id) return;

    // Check if any section is being edited or if profile picture is being uploaded
    if (!isEditingPersonal && !isEditingContact && !isEditingAccess && !selectedUpload) {
      toast.error("No changes to save");
      return;
    }

    // If only profile picture is being uploaded, create minimal update data
    if (selectedUpload && !isEditingPersonal && !isEditingContact && !isEditingAccess) {
      const updateData = new FormData();
      updateData.append("profile_photo", selectedUpload);
      
      updateProfile(
        { userId: currentUser.id, formData: updateData },
        {
          onSuccess: () => {
            toast.success("Profile picture updated successfully!");
            setIsUploadModalOpen(false);
            setSelectedUpload(null);
          },
          onError: (error) => {
            console.error("Profile picture update failed:", error);
            toast.error("Failed to update profile picture");
          },
        }
      );
      return;
    }

    if (isEditingContact && !validateEmailFormat(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const updateData = new FormData();
    
    if (isEditingPersonal) {
      const combinedName = `${firstName} ${lastName}`.trim() || formData.name;
      updateData.append("name", combinedName);
      updateData.append("bio", formData.bio);
    }
    
    if (isEditingContact) {
      updateData.append("email", formData.email);
      updateData.append("phone", formData.phone);
    }
    
    if (isEditingAccess) {
      updateData.append("job_title", formData.job_title);
    }

    if (selectedUpload) {
      updateData.append("profile_photo", selectedUpload);
    }

    updateProfile(
      { userId: currentUser.id, formData: updateData },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully!");
          setIsEditingPersonal(false);
          setIsEditingContact(false);
          setIsEditingAccess(false);
          setIsUploadModalOpen(false);
          setSelectedUpload(null);
        },
        onError: (error) => {
          console.error("Profile update failed:", error);
          toast.error("Failed to update profile");
        },
      }
    );
  };

  const handleCancel = () => {
    const currentUser = profileData || user;
    if (currentUser) {
      // Reset form data to original values
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        job_title: currentUser.job_title || "",
        access_level: currentUser.access_level || "",
        phone: currentUser.phone || "",
        profile_photo: null,
      });
      const parts = (currentUser.name || "").split(" ");
      setFirstName(parts.slice(0, -1).join(" ") || parts[0] || "");
      setLastName(parts.length > 1 ? parts.slice(-1).join(" ") : "");
    }
    setIsEditingPersonal(false);
    setIsEditingContact(false);
    setIsEditingAccess(false);
    setSelectedUpload(null);
  };

  // Handle edit button clicks - ensure only one section is edited at a time
  const handleEditClick = (section: 'personal' | 'contact' | 'access') => {
    // Check if any other section is currently being edited
    const isAnySectionEditing = isEditingPersonal || isEditingContact || isEditingAccess;
    
    if (isAnySectionEditing) {
      // If clicking on a different section, ask user to save or cancel current changes
      const currentEditingSection = isEditingPersonal ? 'Personal Details' : 
                                   isEditingContact ? 'Contact Details' : 'Access & Security';
      
      if (confirm(`You are currently editing ${currentEditingSection}. Do you want to save your changes first?`)) {
        // User wants to save, so call handleSubmit
        handleSubmit();
      } else {
        // User wants to discard changes, so call handleCancel
        handleCancel();
      }
      return;
    }
    
    // Toggle the clicked section
    switch (section) {
      case 'personal':
        setIsEditingPersonal(true);
        break;
      case 'contact':
        setIsEditingContact(true);
        break;
      case 'access':
        setIsEditingAccess(true);
        break;
    }
  };

  // Handle cancel button clicks with unsaved changes warning
  const handleCancelWithWarning = () => {
    const hasChanges = hasAnyChanges();
    
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        handleCancel();
      }
    } else {
      handleCancel();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const currentUser = profileData || user;

  if (profileLoading && !currentUser) {
    return (
      <Loading
        message="Loading Profile..."
        subMessage="Fetching profile data"
      />
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header hero with avatar and welcome */}
        <div className="bg-background-light rounded-xl border border-border-dark mb-6">
          <div className="px-6 py-8 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div
                className="w-38 h-38 mx-auto rounded-full overflow-hidden border-1 border-gray-300 cursor-pointer group"
                // onClick={() => setIsUploadModalOpen(true)}
                role="button"
                aria-label="Change profile picture"
              >
                {currentUser?.profile_photo ? (
                  <img
                    src={currentUser.profile_photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-lightest flex items-center justify-center">
                    <span className="text-green-darkest text-3xl font-semibold">
                      {getInitials(currentUser?.name)}
                    </span>
                  </div>
                )}
                
                {/* Camera icon overlay on profile picture */}
                <div className="absolute bottom-2 right-2 p-2 bg-green-dark text-white rounded-full shadow-lg hover:bg-green-icon transition-colors">
                  <IconCameraUp className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-dark font-medium">
                Welcome, {currentUser?.name}
              </div>
              <div className="text-xs text-gray-light">
                Manage your info, privacy, and security to make Pactle work
                better for you.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Details Section */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Personal details */}
              <div className={`bg-background-light border rounded-lg border-border-dark`}>
                <div className="flex items-center justify-between mb-3 border-b border-border-dark p-4">
                  <h3 className="text-lg font-medium text-gray-dark">
                    Personal details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Input
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    disabled={!isEditingPersonal}
                  />
                  <Input
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    disabled={!isEditingPersonal}
                  />
                </div>
                <div className="p-4">
                  <TextArea
                    label="Bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    name="bio"
                    rows={3}
                    placeholder="Add your bio"
                    disabled={!isEditingPersonal}
                  />
                </div>
                <div className="flex justify-end p-4">
                  {(!isEditingPersonal && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick('personal')}
                    >
                      Edit
                    </Button>
                  )) || (
                    <div className="flex justify-between gap-3 w-full">
                      <Button variant="back" onClick={handleCancelWithWarning}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!isEditingPersonal || !hasPersonalChanges() || isLoading}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className={`bg-background-light border rounded-lg border-border-dark`}>
                <div className="flex items-center justify-between mb-3 border-b border-border-dark p-4">
                  <h3 className="text-lg font-medium text-gray-dark">
                    Access & security
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Dropdown
                    label="Job title"
                    options={jobTitleOptions}
                    selected={formData.job_title}
                    onChange={(value) => {
                      if (!isEditingAccess || isLockedRole) return;
                      setFormData((prev) => ({
                        ...prev,
                        job_title: value.toString(),
                      }));
                    }}
                    disabled={!isEditingAccess}
                    triggerClassName={isLockedRole ? 'cursor-not-allowed opacity-60' : undefined}
                  />
                  <Input
                    label="Dashboard Access"
                    value={formData.access_level}
                    onChange={handleInputChange}
                    name="access_level"
                    disabled
                    placeholder="Access level"
                  />
                </div>
                <div className="flex justify-end p-4">
                  {(!isEditingAccess && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { if (!isLockedRole) handleEditClick('access'); }}
                      disabled={isLockedRole}
                    >
                      Edit
                    </Button>
                  )) || (
                    <div className="flex justify-between gap-3 w-full">
                      <Button variant="back" onClick={handleCancelWithWarning}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!isEditingAccess || !hasAccessChanges() || isLoading}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Right column: Profile picture and Access & security */}
          <div className="space-y-6">
            <div>
              {/* Contact details */}
              <div className={`bg-background-light border rounded-lg border-border-dark`}>
                <div className="flex items-center justify-between mb-3 border-b border-border-dark p-4">
                  <h3 className="text-lg font-medium text-gray-dark">
                    Contact details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Input
                    label="Work email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    disabled={!isEditingContact}
                  />
                  <PhoneInput
                    label="Contact number"
                    value={formData.phone}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, phone: val }))
                    }
                    placeholder="contact number"
                    maxDigits={10}
                    disabled={!isEditingContact}
                  />
                </div>
                {/* <div className="px-4 pb-4">
                  <TextArea
                    label="Address"
                    name="address"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Address"
                    disabled={!isEditingContact}
                  />
                </div> */}
                <div className="flex justify-end p-4">
                  {(!isEditingContact && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick('contact')}
                    >
                      Edit
                    </Button>
                  )) || (
                    <div className="flex justify-between gap-3 w-full">
                      <Button variant="back" onClick={handleCancelWithWarning}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!isEditingContact || !hasContactChanges() || isLoading}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setIsUploadModalOpen(false)
          }
        >
          <div className="bg-background-light rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark">
              <h3 className="text-lg font-semibold text-gray-dark">
                Upload profile picture
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-6">
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                  <IconUpload className="w-6 h-6 text-gray-light" />
                  <div className="text-sm text-gray-dark">
                    Drop file here or click to upload
                  </div>
                  <div className="text-xs text-gray-light">
                    File format: JPG or PNG files
                  </div>
                  <div className="text-xs text-gray-light">
                    Image size: Use a square image. Maximum size is generally
                    2MB–5MB
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {selectedUpload && (
                <div className="text-xs text-gray-light mt-3">
                  Selected: {selectedUpload.name}
                </div>
              )}
            </div>
            <div className="px-6 pb-5">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedUpload || isLoading}
              >
                Upload Profile Picture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
