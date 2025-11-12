import React, { useState } from "react";
import { IconX, IconCopy, IconCheck } from "@tabler/icons-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface InvitationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitationLink: string;
  userEmail: string;
  userName: string;
}

export const InvitationLinkModal: React.FC<InvitationLinkModalProps> = ({
  isOpen,
  onClose,
  invitationLink,
  userEmail,
  userName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      const textArea = document.createElement("textarea");
      textArea.value = invitationLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-gray-dark">
            Invitation Link Generated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-light hover:text-gray-dark transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-lightest border border-green-light rounded-lg p-4">
            <h3 className="font-medium text-green-dark mb-2">
              Invitation sent to {userName}
            </h3>
            <p className="text-sm text-green-dark">
              An email has been sent to <strong>{userEmail}</strong> with the
              invitation link.
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Input
                label="Invitation Link"
                type="text"
                value={invitationLink}
                readOnly
              />
              <Button
                onClick={handleCopyLink}
                variant="ghost"
                size="sm"
                className="px-3 py-2"
              >
                {copied ? (
                  <IconCheck size={16} className="text-green-default" />
                ) : (
                  <IconCopy size={16} />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-default mt-1">
                Link copied to clipboard!
              </p>
            )}
          </div>

          <div className="bg-yellow-lightest border border-yellow-light rounded-lg p-4">
            <h4 className="font-medium text-yellow-dark mb-2">
              Security Notice
            </h4>
            <ul className="text-xs text-yellow-dark space-y-1">
              <li>• This invitation link will expire in 72 hours</li>
              <li>• Only share this link with the intended recipient</li>
              <li>• The link is tied to the specific email address</li>
              <li>• Each link can only be used once</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-border-dark">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
