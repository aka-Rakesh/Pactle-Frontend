import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";
import {
  findHelpArticle,
  findHelpCategory,
  helpArticles,
} from "./helpData";

const HelpArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryKey, articleSlug } = useParams<{
    categoryKey: string;
    articleSlug: string;
  }>();
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  const category = useMemo(
    () => (categoryKey ? findHelpCategory(categoryKey) : undefined),
    [categoryKey]
  );

  const article = useMemo(
    () => (articleSlug ? findHelpArticle(articleSlug, categoryKey) : undefined),
    [articleSlug, categoryKey]
  );

  const relatedArticles = useMemo(() => {
    if (!article?.related?.length) return [];
    return article.related
      .map((slug) => helpArticles.find((item) => item.slug === slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [article]);

  if (!category || !article) {
    return (
      <div className="p-6 font-inter">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-dark">Article unavailable</h1>
          <p className="text-sm text-gray-light">
            The article you're looking for could not be found. It may have been moved or archived.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate("/dashboard/help")}
              className="inline-flex h-10 px-4 items-center justify-center rounded-lg bg-[#2E4828] text-white text-sm font-medium hover:bg-[#253b21] transition-colors"
            >
              Back to Help &amp; Support
            </button>
            {categoryKey && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/help/category/${categoryKey}`)}
                className="inline-flex h-10 px-4 items-center justify-center rounded-lg border border-border-dark text-sm font-medium text-[#3F3F46] hover:bg-[#F6F4EF] transition-colors"
              >
                Back to Category
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-inter">
      <div className="max-w-[1121px] mx-auto space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-light">
            <button
              type="button"
              onClick={() => navigate("/dashboard/help")}
              className="hover:text-gray-dark transition-colors"
            >
              Help &amp; Support
            </button>
            <IconChevronRight className="w-4 h-4" />
            <button
              type="button"
              onClick={() => navigate(`/dashboard/help/category/${category.key}`)}
              className="hover:text-gray-dark transition-colors"
            >
              Category
            </button>
            <IconChevronRight className="w-4 h-4" />
            <span className="text-[#3F3F46] font-medium">{article.title}</span>
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[#3F3F46]">{article.title}</h1>
              {article.summary && (
                <p className="text-sm text-[#6B6B74] max-w-3xl">{article.summary}</p>
              )}
            </div>
            {article.lastUpdated && (
              <p className="text-sm text-[#6B6B74]">Last updated on {article.lastUpdated}</p>
            )}
          </div>
        </header>

        <article className="bg-white rounded-2xl border border-border-dark px-10 py-8 space-y-8 shadow-sm">
          <div className="space-y-5 text-sm text-[#3F3F46] leading-relaxed">
            {article.sections.map((section, index) => {
              if (section.type === "paragraph") {
                return <p key={index}>{section.text}</p>;
              }
              if (section.type === "ordered-list") {
                return (
                  <ol key={index} className="list-decimal pl-6 space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                );
              }
              return null;
            })}
          </div>

          <div className="h-px bg-[#E0D8C8]" />

          <div className="space-y-4">
            <p className="text-sm font-medium text-[#3F3F46]">Was this article helpful?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setFeedback("yes")}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                  feedback === "yes"
                    ? "bg-[#2E4828] text-white"
                    : "bg-[#E2F2E6] text-[#2E4828] hover:bg-[#CFE8D6]"
                }`}
              >
                Yes, Thanks
              </button>
              <button
                type="button"
                onClick={() => setFeedback("no")}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                  feedback === "no"
                    ? "bg-[#2E4828] text-white"
                    : "bg-[#F4F2ED] text-[#3F3F46] hover:bg-[#E4DED3]"
                }`}
              >
                Not Really
              </button>
            </div>
            {feedback && (
              <p className="text-xs text-[#6B6B74]">
                Thanks for your response{feedback === "no" ? ", we’ll review this article soon." : "."}
              </p>
            )}
          </div>

          <div className="h-px bg-[#E0D8C8]" />

          {relatedArticles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#3F3F46]">
                You might also find these helpful
              </p>
              <ul className="space-y-2">
                {relatedArticles.map((related) => (
                  <li key={related.slug}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/dashboard/help/category/${related.categoryKey}/article/${related.slug}`)
                      }
                      className="text-sm text-[#2E4828] underline hover:text-[#253b21] transition-colors"
                    >
                      {related.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/help/category/${category.key}`)}
              className="inline-flex w-[188px] h-[40px] items-center justify-center gap-2 rounded-lg bg-[#2E4828] text-white text-sm font-medium hover:bg-[#253b21] transition-colors"
            >
              Back to Category
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};

export default HelpArticlePage;
