import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconChevronRight, IconMailOpened, IconArrowNarrowRight } from "@tabler/icons-react";
import { helpCategories } from "./helpData";
import { Button } from "../../components/ui/Button";

const HelpCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryKey } = useParams<{ categoryKey: string }>();

  const category = useMemo(
    () => helpCategories.find((cat) => cat.key === categoryKey),
    [categoryKey]
  );

  if (!category) {
    return (
      <div className="p-6 font-inter">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-dark">Help &amp; Support</h1>
            <div className="flex items-center gap-2 text-sm text-gray-light">
              <span>Help &amp; Support</span>
              <IconChevronRight className="w-4 h-4" />
              <span className="text-gray-dark font-medium">Category</span>
            </div>
          </header>
          <div className="bg-white border border-border-dark rounded-xl p-10 text-center space-y-6">
            <p className="text-base text-gray-dark">This category could not be found.</p>
            <Button size="sm" onClick={() => navigate("/dashboard/help")}>Back to Help &amp; Support</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-inter">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-dark">Help &amp; Support</h1>
          <div className="flex items-center gap-2 text-sm text-gray-light">
            <button
              type="button"
              onClick={() => navigate("/dashboard/help")}
              className="text-gray-light hover:text-gray-dark transition-colors"
            >
              Help &amp; Support
            </button>
            <IconChevronRight className="w-4 h-4" />
            <span className="text-gray-dark font-medium">Category</span>
          </div>
        </header>

        <section className="bg-[#F6F4EF] border border-border-dark rounded-2xl p-10 space-y-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#ECE8DF] border border-[#D6CEC0] flex items-center justify-center">
                <IconMailOpened className="w-4 h-4 text-gray-dark" />
              </div>
              <h2 className="text-lg font-semibold text-gray-dark">{category.title}</h2>
            </div>
            <p className="text-sm text-[#6B6B74]">
              Browse articles in this category to get detailed instructions, best practices, and helpful tips from the Pactle team.
            </p>
          </div>

          <ul className="space-y-2">
            {category.articles.map((article) => (
              <li key={article}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 text-left px-4 py-3 rounded-lg border border-transparent hover:border-border-dark hover:bg-white transition-colors text-sm text-gray-dark"
                  onClick={() => {
                    console.log("help.article.open", { category: category.key, article });
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[#958F7E]">•</span>
                    <span className="truncate">{article}</span>
                  </span>
                  <IconArrowNarrowRight className="w-4 h-4 text-[#958F7E] flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/help")}
              className="inline-flex h-11 px-6 items-center justify-center rounded-lg bg-[#2E4828] text-white text-sm font-medium hover:bg-[#253b21] transition-colors"
            >
              Back to Help &amp; Support
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCategoryPage;
