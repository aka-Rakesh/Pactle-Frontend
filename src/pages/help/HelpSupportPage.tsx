import React, { useEffect, useMemo, useState } from "react";
import {
  IconHeadset,
  IconFileLike,
  IconMessageReport,
  IconChevronDown,
  IconChevronRight,
  IconArrowNarrowRight,
  IconMessage2,
  IconSearch,
  IconSend,
  IconX,
  IconMailOpened,
} from "@tabler/icons-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextArea";

const Modal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}> = ({ open, title, onClose, children, widthClass = "max-w-xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-background-light rounded-lg shadow-xl w-full ${widthClass} mx-4 p-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-dark">{title}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-hover-light" aria-label="Close">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const SlideOver: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md bg-background-light shadow-2xl border-l border-border-dark flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark bg-background-dark">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-darkest/15 rounded-lg flex items-center justify-center">
              <IconMessage2 className="w-4 h-4 text-green-darkest" />
            </div>
            <h3 className="text-sm font-semibold text-gray-dark">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-hover-light" aria-label="Close">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {children}
        </div>
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
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const openChat = () => {
    const w = window as any;
    if (w?.$crisp) {
      w.$crisp.push(["do", "chat:open"]);
      return;
    }
    if (w?.Intercom) {
      w.Intercom("show");
      return;
    }
    setShowChat(true);
  };

  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const [bugTitle, setBugTitle] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const [bugText, setBugText] = useState("");

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

      

      <Modal open={showFeedback} title="Submit Feedback" onClose={() => setShowFeedback(false)}>
        <div className="space-y-4">
          <Input label="Title" placeholder="Brief summary" value={feedbackTitle} onChange={(e) => setFeedbackTitle(e.target.value)} />
          <TextArea label="Your feedback" rows={5} placeholder="What would you like to see improved?" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="cta" onClick={() => setShowFeedback(false)}>Cancel</Button>
            <Button onClick={() => {
              console.log("feedback.submit", { title: feedbackTitle, text: feedbackText });
              setShowFeedback(false);
              setFeedbackTitle("");
              setFeedbackText("");
            }}>Submit</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showBug} title="Report a bug / issue" onClose={() => setShowBug(false)}>
        <div className="space-y-4">
          <Input label="Title" placeholder="Short description" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">Severity</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white border-gray-300 text-sm"
                value={bugSeverity}
                onChange={(e) => setBugSeverity(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-dark mb-1">Screenshots</label>
              <input type="file" multiple accept="image/*" className="w-full text-sm" />
            </div>
          </div>
          <TextArea label="What happened?" rows={6} placeholder="Steps to reproduce, expected vs actual results, environment details…" value={bugText} onChange={(e) => setBugText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="cta" onClick={() => setShowBug(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              console.log("bug.report", { title: bugTitle, severity: bugSeverity, text: bugText });
              setShowBug(false);
              setBugTitle("");
              setBugText("");
              setBugSeverity("medium");
            }}>Submit</Button>
          </div>
        </div>
      </Modal>

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
