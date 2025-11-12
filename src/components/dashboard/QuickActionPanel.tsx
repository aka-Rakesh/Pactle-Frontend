import { IconPlus } from "@tabler/icons-react";
import React from "react";
import { Button } from "../ui/Button";
import { usePermissions } from "../../hooks/usePermissions";
import type { QuickActionsPanelProps } from "../../types/common";

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onButtonClick }) => {
  const { can } = usePermissions();
  const canCreateQuote = can("quotations.create");
  return (
    <div className="bg-white pt-6 sm:pt-0">
      {/* <h3 className="text-xl font-semibold text-gray-dark mb-4">
        Quick Actions
      </h3> */}
      <div className="space-y-3">
        <Button onClick={onButtonClick} className="w-full sm:px-20 py-2.5" disabled={!canCreateQuote} title={!canCreateQuote ? "You don't have permission to create quotations" : undefined}>
          <IconPlus className="w-4 h-4" />
          <span>New Quotes</span>
        </Button>
        {/* <Button className="w-full">
          <IconSend className="w-4 h-4" />
          <span>Send follow-ups</span>
        </Button>
        <Button className="w-full">
          <IconCheck className="w-4 h-4" />
          <span>Approve all drafts</span>
        </Button> */}
      </div>
    </div>
  );
};

export default QuickActionsPanel;
