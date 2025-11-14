import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IconHeadset,
  IconFileLike,
  IconMessageReport,
  IconChevronDown,
  IconChevronRight,
  IconArrowNarrowRight,
  IconSearch,
  IconSend,
  IconX,
  IconMailOpened,
  IconCircleCheck,
  IconCloudUpload,
} from "@tabler/icons-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/cn";

type SlideOverProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

const SlideOver: React.FC<SlideOverProps> = ({
  open,
  title,
  onClose,
  children,
  subtitle,
  icon,
  panelClassName,
  headerClassName,
  bodyClassName,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-full sm:max-w-md bg-background-light shadow-2xl border-l border-border-dark flex flex-col",
          panelClassName
        )}
      >
        <div
          className={cn(
            "px-4 py-3 border-b border-border-dark bg-background-dark flex items-start justify-between gap-3",
            headerClassName
          )}
        >
          <div className={cn("flex items-start", icon ? "gap-3" : "gap-0")}
          >
            {icon && <div className="pt-0.5">{icon}</div>}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-dark">{title}</h3>
              {subtitle && <p className="text-xs text-gray-light leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-hover-light" aria-label="Close">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className={cn("flex-1 overflow-y-auto p-4 space-y-3", bodyClassName)}>{children}</div>
      </div>
    </div>
  );
};

const sampleFaqs = [
  {
    q: "How do I create a new quote?",
    a: "Go to Quotes → New Quote. Select customer, add items, and click Save Draft. Once ready, click Send for Approval.",
  },
  { q: "Why is my quote stuck in ‘Review’?", a: "An approver needs to take action. Check the Approvals tab or notify your manager." },
  { q: "How do I sync Pactle with my ERP?", a: "Go to Settings → Integrations and follow the ERP setup instructions for your system." },
  { q: "How do I edit a sent quote?", a: "Open the quote → Actions → Create revision. Changes after send are tracked as revisions." },
  { q: "How do I add new team members?", a: "Go to Members → Invite member. Assign their role and permissions, and send the invite." },
];

const knowledgeBase = [
  {
    key: "rfq",
    title: "RFQs & Quotes",
    articles: [
      "Creating a new quote",
      "Editing item details",
      "Submitting for approval",
      "Adding customers to quotes",
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
    ],
  },
  {
    key: "erp",
    title: "ERP Integration",
    articles: [
      "Connecting your ERP",
      "Sync errors and fixes",
      "What data gets synced",
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
    ],
  },
  {
    key: "users",
    title: "User Management",
    articles: [
      "Adding new users",
      "Changing user roles",
      "Deactivating an account",
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
    ],
  },
];

const HelpSupportPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showBug, setShowBug] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const groupedResults = useMemo(() => {
    if (!query.trim()) return [] as Array<{ group: string; items: string[] }>;
    const q = query.toLowerCase();
    const results: Array<{ group: string; items: string[] }> = [];
    for (const cat of knowledgeBase) {
      const items = cat.articles.filter((a) => a.toLowerCase().includes(q));
      if (items.length) results.push({ group: cat.title, items });
    }
    const faqMatches = sampleFaqs
      .filter((f) => f.q.toLowerCase().includes(q))
      .map((f) => f.q);
    if (faqMatches.length) results.unshift({ group: "FAQs", items: faqMatches });
    return results;
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#help-search-wrapper")) {
        setShowSuggestions(false);
      }
      if (feedbackTypeRef.current && !feedbackTypeRef.current.contains(target)) {
        setShowFeedbackTypeOptions(false);
      }
      if (severityRef.current && !severityRef.current.contains(target)) {
        setShowSeverityOptions(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const chatListener = () => setShowChat(true);
    window.addEventListener("pactle:open-help-chat", chatListener);
    return () => window.removeEventListener("pactle:open-help-chat", chatListener);
  }, []);

  const openChat = () => {
    setShowChat(true);
  };

  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImpact, setFeedbackImpact] = useState("");
  const [showFeedbackTypeOptions, setShowFeedbackTypeOptions] = useState(false);
  const feedbackTypeRef = useRef<HTMLDivElement | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);

  const [bugTitle, setBugTitle] = useState("");
  const [bugSeverity, setBugSeverity] = useState("");
  const [bugText, setBugText] = useState("");
  const [showSeverityOptions, setShowSeverityOptions] = useState(false);
  const severityRef = useRef<HTMLDivElement | null>(null);
  const [showBugToast, setShowBugToast] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<string | null>(null);

  const activeCat = useMemo(() => knowledgeBase.find((c) => c.key === activeCategory) || null, [activeCategory]);

  return (
    <div className="p-6 font-inter">
      <div className="max-w-6xl mx-auto space-y-10">

        <section className="bg-background-light rounded-lg border border-border-dark" style={{ width: '1121px', height: '336px', padding: '80px 160px 84px 160px', margin: '0 auto' }}>
          <div className="space-y-6">
            <p className="text-center text-gray-dark font-semibold text-[20px] leading-[20px] font-inter" style={{ letterSpacing: '-0.015em' }}>Hello, how can we help?</p>

            <div id="help-search-wrapper" className="relative mx-auto" style={{ width: '801px' }}>
              <div className="relative">
                <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-light" />
                <Input
                  variant="search"
                  placeholder="Search articles, FAQs, or past issues"
                  value={query}
                  className="h-[40px]"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => query && setShowSuggestions(true)}
                />
              </div>

              {showSuggestions && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-border-dark rounded-lg shadow-lg max-h-72 overflow-auto">
                  {groupedResults.length === 0 ? (
                    <div className="p-4 text-sm text-gray-light">No results</div>
                  ) : (
                    <div className="divide-y divide-border-dark">
                      {groupedResults.map((grp, idx) => (
                        <div key={idx} className="p-3">
                          <div className="text-xs font-semibold text-gray-light uppercase tracking-wide mb-2">{grp.group}</div>
                          <div className="space-y-1">
                            {grp.items.slice(0, 5).map((item, i) => (
                              <button
                                key={i}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-background-dark text-sm text-gray-dark flex items-center justify-between"
                                onClick={() => {
                                  setQuery(item);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="truncate">{item}</span>
                                <IconChevronRight className="w-4 h-4 text-gray-light" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-[17px] pt-1 mx-auto" style={{ width: '801px' }}>
              <button
                onClick={openChat}
                className="flex items-center justify-center w-full h-[60px] rounded-lg gap-3 text-white bg-[#2e4828] hover:opacity-95"
              >
                <IconHeadset className="w-7 h-7 text-white flex-shrink-0" />
                <span className="font-inter text-[14px] leading-[20px] font-medium" style={{ letterSpacing: '-0.03em' }}>
                  Chat with support
                </span>
              </button>

              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center justify-center w-full h-[60px] rounded-lg gap-3 text-white bg-[#958f7e] hover:opacity-95"
              >
                <IconFileLike className="w-7 h-7 text-white flex-shrink-0" />
                <span className="font-inter text-[14px] leading-[20px] font-medium" style={{ letterSpacing: '-0.03em' }}>
                  Share feedback
                </span>
              </button>

              <button
                onClick={() => setShowBug(true)}
                className="flex items-center justify-center w-full h-[60px] rounded-lg gap-3 text-white bg-[#492728] hover:opacity-95"
              >
                <IconMessageReport className="w-7 h-7 text-white flex-shrink-0" />
                <span className="font-inter text-[14px] leading-[20px] font-medium" style={{ letterSpacing: '-0.03em' }}>
                  Report a bug
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 mt-16">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-dark mb-6">Frequently asked questions</h2>
          </div>
          <div className="space-y-2 max-w-[632px] mx-auto">
            {sampleFaqs.map((f, idx) => {
              const open = expandedFaq === idx;
              return (
                <div key={idx} className="border border-border-dark rounded-md bg-background-light">
                  <button
                    className="w-full text-left px-5 py-5 flex items-center justify-between h-[56px]"
                    onClick={() => setExpandedFaq(open ? null : idx)}
                  >
                    <span className="text-sm font-semibold text-gray-dark">{f.q}</span>
                    <IconChevronDown className={`w-4 h-4 text-gray-light transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 text-sm text-gray-light leading-relaxed">{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <button className="text-sm text-gray-light hover:underline">See all questions →</button>
          </div>
        </section>

        <section className="space-y-8 mt-16">
          <h2 className="text-lg font-semibold text-gray-dark text-center">Knowledge Base</h2>
          {!activeCategory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
              {knowledgeBase.map((cat) => (
                <div
                  key={cat.key}
                  className="bg-background-light rounded-lg border border-border-dark p-6 flex flex-col justify-between"
                  style={{ width: "360px", height: "260px" }}
                >
                  <div className="flex items-center gap-[10px]">
                    <div className="w-7 h-7 border border-[#D6CEC0] rounded bg-[#ECE8DF] p-[6px] flex items-center justify-center">
                      <IconMailOpened className="w-4 h-4 text-gray-dark" />
                    </div>
                    <h3 className="font-inter text-[14px] leading-[20px] font-medium text-[#3F3F46]">
                      {cat.title}
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {cat.articles.map((a) => (
                      <li key={a}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategory(cat.key);
                            setActiveArticle(a);
                          }}
                          className="w-full flex items-center justify-between text-left text-[#958F7E] font-inter text-[12px] leading-[20px] gap-3"
                        >
                          <span className="flex items-center gap-[10px]">
                            <span className="text-[#958F7E]">•</span>
                            <span className="truncate">{a}</span>
                          </span>
                          <IconArrowNarrowRight className="w-4 h-4 text-[#958F7E]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className="text-sm text-[12px] font-medium text-[#958F7E] underline"
                    >
                      10 articles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !activeArticle ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button className="text-sm text-gray-light hover:underline" onClick={() => setActiveCategory(null)}>
                  ← Back to categories
                </button>
                <span className="text-sm text-gray-light">/</span>
                <span className="text-sm text-gray-dark font-medium">{activeCat?.title}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeCat?.articles.map((a) => (
                  <div key={a} className="bg-background-light rounded-lg border border-border-dark p-4 flex items-center justify-between">
                    <span className="text-sm text-gray-dark truncate pr-3">{a}</span>
                    <Button size="sm" onClick={() => setActiveArticle(a)}>Open</Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button className="text-sm text-gray-light hover:underline" onClick={() => setActiveArticle(null)}>
                  ← Back to {activeCat?.title}
                </button>
              </div>
              <article className="bg-background-light rounded-lg border border-border-dark p-5">
                <h3 className="text-lg font-semibold text-gray-dark mb-2">{activeArticle}</h3>
                <div className="prose prose-sm max-w-none text-gray-dark">
                  <p>
                    This is a placeholder article. Connect this view to your help database to render real content. Include screenshots, step-by-step instructions, and relevant links.
                  </p>
                  <ol className="list-decimal pl-6">
                    <li>Go to the relevant page in the dashboard.</li>
                    <li>Follow the on-screen steps as outlined.</li>
                    <li>Verify the result and retry if needed.</li>
                  </ol>
                </div>
                <div className="pt-6 mt-6 border-t border-border-dark flex items-center justify-between">
                  <div className="text-sm text-gray-dark">Was this helpful?</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="cta">Yes</Button>
                    <Button size="sm" variant="back">No</Button>
                  </div>
                </div>
              </article>
              <div>
                <h4 className="text-sm font-semibold text-gray-dark mb-2">Related articles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {(activeCat?.articles || []).filter((a) => a !== activeArticle).slice(0, 3).map((a) => (
                    <button key={a} className="bg-background-light rounded-lg border border-border-dark p-3 text-left hover:bg-background-dark" onClick={() => setActiveArticle(a)}>
                      <div className="text-sm text-gray-dark truncate">{a}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      

      <SlideOver
        open={showFeedback}
        title="Share Feedback"
        subtitle="Help us make Pactle better for your team."
        icon={
          <div className="w-9 h-9 rounded-md bg-[#ECE8DF] flex items-center justify-center">
            <IconFileLike className="w-4 h-4 text-[#492728]" />
          </div>
        }
        bodyClassName="space-y-6 flex flex-col h-full"
        onClose={() => {
          setShowFeedback(false);
          setShowFeedbackTypeOptions(false);
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Type of feedback</label>
          <div ref={feedbackTypeRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFeedbackTypeOptions((prev) => !prev)}
              className="w-full h-11 px-3 pr-10 rounded-[10px] border border-border-dark bg-white text-sm shadow-[0_1px_2px_rgba(63,63,70,0.05)] flex items-center justify-between"
            >
              <span className={`${feedbackType ? "text-[#3F3F46]" : "text-[#958F7E]"}`}>
                {feedbackType ? feedbackType : "Select feedback type"}
              </span>
              <IconChevronDown
                className={`w-4 h-4 text-[#958F7E] transition-transform ${showFeedbackTypeOptions ? "rotate-180" : ""}`}
              />
            </button>
            {showFeedbackTypeOptions && (
              <div className="absolute top-full left-0 mt-2 w-full rounded-[10px] border border-border-dark bg-white shadow-[0_8px_16px_rgba(63,63,70,0.08)] overflow-hidden">
                {["General feedback", "Feature request", "Bug spotted", "Other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      feedbackType === option ? "bg-[#F4F2ED] text-[#3F3F46]" : "text-[#3F3F46] hover:bg-[#F4F2ED]"
                    }`}
                    onClick={() => {
                      setFeedbackType(option);
                      setShowFeedbackTypeOptions(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Feedback</label>
          <textarea
            rows={5}
            className="w-full px-3 py-3 rounded-lg border border-border-dark bg-white text-sm text-[#3F3F46] resize-none focus:outline-none focus:ring-2 focus:ring-green-light"
            placeholder="Write your feedback here"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
          <p className="text-xs text-[#958F7E]">*Be as specific as you can — it helps us understand your needs.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Impact Level (optional)</label>
          <input
            className="w-full h-11 px-3 rounded-lg border border-border-dark bg-white text-sm text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-green-light"
            placeholder="Enter here"
            value={feedbackImpact}
            onChange={(e) => setFeedbackImpact(e.target.value)}
          />
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-dark">
          <button
            type="button"
            className="h-11 px-6 rounded-lg bg-[#E4DED3] text-sm text-[#3F3F46]"
            onClick={() => {
              setShowFeedback(false);
              setShowFeedbackTypeOptions(false);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-11 px-6 rounded-lg bg-[#2E4828] text-white text-sm"
            onClick={() => {
              console.log("feedback.submit", {
                type: feedbackType,
                feedback: feedbackText,
                impact: feedbackImpact,
              });
              setShowFeedback(false);
              setShowFeedbackTypeOptions(false);
              setFeedbackType("");
              setFeedbackText("");
              setFeedbackImpact("");
              setShowFeedbackToast(true);
            }}
          >
            Submit feedback
          </button>
        </div>
      </SlideOver>

      {showFeedbackToast && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/35" onClick={() => setShowFeedbackToast(false)} />
          <div className="relative w-[420px] max-w-[calc(100%-32px)] shadow-[0_20px_45px_rgba(63,63,70,0.18)] rounded-xl overflow-hidden border border-border-dark bg-white">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#E6EAF4]">
              <span className="w-7 h-7 rounded-full bg-[#E2F2E6] flex items-center justify-center">
                <IconCircleCheck className="w-4 h-4 text-[#2E4828]" />
              </span>
              <h4 className="text-sm font-semibold text-[#3F3F46]">Thanks for feedback!</h4>
            </div>
            <div className="px-6 py-5 bg-[#FBF9F3] text-sm text-[#3F3F46] space-y-4">
              <p>
                We’ve received your suggestion. Our product team reviews feedback regularly to shape future updates.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#2E4828] text-white text-sm"
                  onClick={() => setShowFeedbackToast(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <SlideOver
        open={showBug}
        title="Report a Bug"
        subtitle="Tell us what’s not working — our support team will look into it right away."
        icon={
          <div className="w-9 h-9 rounded-md bg-[#ECE8DF] flex items-center justify-center">
            <IconMessageReport className="w-4 h-4 text-[#492728]" />
          </div>
        }
        bodyClassName="space-y-6"
        onClose={() => {
          setShowBug(false);
          setShowSeverityOptions(false);
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Title</label>
          <input
            className="w-full h-11 px-3 rounded-lg border border-border-dark bg-white text-sm text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-green-light"
            placeholder="Enter a title"
            value={bugTitle}
            onChange={(e) => setBugTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Description</label>
          <textarea
            rows={6}
            className="w-full px-3 py-3 rounded-lg border border-border-dark bg-white text-sm text-[#3F3F46] resize-none focus:outline-none focus:ring-2 focus:ring-green-light"
            placeholder="Enter a description"
            value={bugText}
            onChange={(e) => setBugText(e.target.value)}
          />
          <p className="text-xs text-[#958F7E]">*The more detail you provide, the faster we can fix it.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Severity</label>
          <div ref={severityRef} className="relative">
            <button
              type="button"
              onClick={() => setShowSeverityOptions((prev) => !prev)}
              className="w-full h-11 px-3 pr-10 rounded-[10px] border border-border-dark bg-white text-sm shadow-[0_1px_2px_rgba(63,63,70,0.05)] flex items-center justify-between"
            >
              <span className={`${bugSeverity ? "text-[#3F3F46]" : "text-[#958F7E]"}`}>
                {bugSeverity ? bugSeverity.charAt(0).toUpperCase() + bugSeverity.slice(1) : "Select severity level"}
              </span>
              <IconChevronDown
                className={`w-4 h-4 text-[#958F7E] transition-transform ${showSeverityOptions ? "rotate-180" : ""}`}
              />
            </button>
            {showSeverityOptions && (
              <div className="absolute top-full left-0 mt-2 w-full rounded-[10px] border border-border-dark bg-white shadow-[0_8px_16px_rgba(63,63,70,0.08)] overflow-hidden">
                {[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      bugSeverity === option.value ? "bg-[#F4F2ED] text-[#3F3F46]" : "text-[#3F3F46] hover:bg-[#F4F2ED]"
                    }`}
                    onClick={() => {
                      setBugSeverity(option.value);
                      setShowSeverityOptions(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#3F3F46]">Attachments</label>
          <button
            type="button"
            className="w-full h-40 border border-border-dark rounded-[10px] bg-white text-sm text-[#958F7E]"
          >
            <div className="h-full w-full rounded-[8px] border border-border-dark flex flex-col items-center justify-center gap-3 px-6">
              <div className="w-12 h-12 rounded-[10px] bg-[#F4F2ED] flex items-center justify-center">
                <IconCloudUpload className="w-6 h-6 text-[#767579]" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-[#3F3F46]">Drop file here or click to upload</div>
                <div className="text-xs">Supported formats: PNG, JPG, JPEG</div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="h-11 px-6 rounded-lg bg-[#E4DED3] text-sm text-[#3F3F46]"
            onClick={() => {
              setShowBug(false);
              setShowSeverityOptions(false);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-11 px-6 rounded-lg bg-[#2E4828] text-white text-sm"
            onClick={() => {
              console.log("bug.report", { title: bugTitle, severity: bugSeverity, text: bugText });
              setShowBug(false);
              setBugTitle("");
              setBugText("");
              setBugSeverity("");
              setShowSeverityOptions(false);
              setShowBugToast(true);
            }}
          >
            Submit report
          </button>
        </div>
      </SlideOver>

      {showBugToast && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/35" onClick={() => setShowBugToast(false)} />
          <div className="relative w-[420px] max-w-[calc(100%-32px)] shadow-[0_20px_45px_rgba(63,63,70,0.18)] rounded-xl overflow-hidden border border-border-dark bg-white">
            <div className="flex items-center gap-3 px-6 py-4 bg-[#E6EAF4]">
              <span className="w-7 h-7 rounded-full bg-[#E2F2E6] flex items-center justify-center">
                <IconCircleCheck className="w-4 h-4 text-[#2E4828]" />
              </span>
              <h4 className="text-sm font-semibold text-[#3F3F46]">Bug report submitted!</h4>
            </div>
            <div className="px-6 py-5 bg-[#FBF9F3] text-sm text-[#3F3F46] space-y-4">
              <p>
                Thanks for the details. Our team will review and get back to you shortly. You can track your issue or
                chat with support anytime from the floating button.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#2E4828] text-white text-sm"
                  onClick={() => setShowBugToast(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SlideOver open={showChat} title="Chat with support" onClose={() => setShowChat(false)}>
        <div className="space-y-3">
          <div className="bg-background-dark rounded-lg p-3 text-sm text-gray-dark">
            Hi! This is a lightweight chat placeholder. If your workspace has Intercom or Crisp configured, the native widget will open instead.
          </div>
          <div className="space-y-2">
            <div className="bg-white border border-border-dark rounded-lg p-3 text-sm">Hello, how can we help?</div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input className="flex-1 px-3 py-2 border rounded-lg text-sm border-gray-300" placeholder="Type a message" />
            <Button size="sm"><IconSend className="w-4 h-4" /></Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
};

export default HelpSupportPage;
