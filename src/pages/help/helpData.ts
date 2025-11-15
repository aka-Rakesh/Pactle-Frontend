export type HelpCategory = {
  key: string;
  title: string;
  articles: string[];
};

export const helpCategories: HelpCategory[] = [
  {
    key: "rfq",
    title: "RFQs & Quotes",
    articles: [
      "Creating a new quote",
      "Editing item details",
      "Submitting for approval",
      "Adding customers to quotes",
      "Duplicating an existing quote",
      "Applying discounts to quotes",
      "Uploading attachments to quotes",
      "Tracking quote status changes",
      "Sending quotes to customers via email",
      "Managing quote templates",
    ],
  },
  {
    key: "approvals",
    title: "Approvals",
    articles: [
      "Setting up approval levels",
      "How managers review quotes",
      "Notifications for approvals",
      "Returning a quote for revision",
      "Escalating pending approvals",
      "Audit trails for approvals",
    ],
  },
  {
    key: "erp",
    title: "ERP Integration",
    articles: [
      "Connecting your ERP",
      "Sync errors and fixes",
      "What data gets synced",
      "Mapping ERP fields",
      "Scheduling sync windows",
    ],
  },
  {
    key: "invoices",
    title: "Invoices & Payments",
    articles: [
      "Creating invoices",
      "Auto reminders for payment",
      "Recording manual payments",
      "Payment reports",
      "Reconciling partial payments",
    ],
  },
  {
    key: "users",
    title: "User Management",
    articles: [
      "Adding new users",
      "Changing user roles",
      "Deactivating an account",
      "Resetting user passwords",
      "Inviting guest collaborators",
    ],
  },
  {
    key: "troubleshooting",
    title: "Troubleshooting",
    articles: [
      "Quote not syncing to ERP",
      "Approval email not received",
      "Invoice showing wrong total",
      "File upload issues",
      "Real-time chat connection issues",
      "Clearing application cache",
    ],
  },
];
