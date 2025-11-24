export type HelpCategoryArticleSummary = {
  slug: string;
  title: string;
};

export type HelpCategory = {
  key: string;
  title: string;
  articles: HelpCategoryArticleSummary[];
};

export type HelpArticleSection =
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] };

export type HelpArticle = {
  slug: string;
  categoryKey: string;
  title: string;
  summary?: string;
  lastUpdated?: string;
  sections: HelpArticleSection[];
  related?: string[];
};

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const rawCategories: Array<{
  key: string;
  title: string;
  articles: string[];
}> = [
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
      "How to Sync Pactle with ERP",
      "Fixing common ERP sync errors",
      "How to reconnect integrations",
      "Viewing sync logs and status",
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

export const helpCategories: HelpCategory[] = rawCategories.map((category) => ({
  ...category,
  articles: category.articles.map((title) => ({
    title,
    slug: slugify(title),
  })),
}));

const placeholderArticles: HelpArticle[] = helpCategories.flatMap((category) =>
  category.articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    categoryKey: category.key,
    summary: `Guidance for ${article.title.toLowerCase()}.`,
    lastUpdated: "October 1, 2025",
    sections: [
      { type: "paragraph", text: `This article will cover ${article.title}.` },
      {
        type: "paragraph",
        text: "Detailed documentation will be published soon. In the meantime, reach out to support if you need assistance.",
      },
    ],
    related: category.articles
      .filter((related) => related.slug !== article.slug)
      .slice(0, 3)
      .map((related) => related.slug),
  }))
);

const syncArticleSlug = slugify("How to Sync Pactle with ERP");

export const helpArticles: HelpArticle[] = placeholderArticles.map((article) => {
  if (article.slug === syncArticleSlug) {
    return {
      ...article,
      summary:
        "Syncing Pactle with your ERP ensures all approved quotations are reflected automatically.",
      lastUpdated: "October 28, 2025",
      sections: [
        {
          type: "paragraph",
          text: "Syncing Pactle with your ERP ensures all approved quotations are reflected automatically.",
        },
        { type: "paragraph", text: "To enable ERP sync:" },
        {
          type: "ordered-list",
          items: [
            "Go to Settings → Integrations.",
            "Click Connect ERP.",
            "Enter your API credentials and test the connection.",
          ],
        },
        {
          type: "paragraph",
          text: "Once connected, all approved quotes will sync every 15 minutes.",
        },
      ],
      related: [
        slugify("Fixing common ERP sync errors"),
        slugify("How to reconnect integrations"),
        slugify("Viewing sync logs and status"),
      ],
    };
  }
  return article;
});

export const findHelpCategory = (key: string): HelpCategory | undefined =>
  helpCategories.find((category) => category.key === key);

export const findHelpArticle = (
  slug: string,
  categoryKey?: string
): HelpArticle | undefined =>
  helpArticles.find(
    (article) => article.slug === slug && (!categoryKey || article.categoryKey === categoryKey)
  );
