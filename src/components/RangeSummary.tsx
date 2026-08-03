"use client";

import { useState, useTransition } from "react";
import { generateRangeSummary } from "@/app/actions";
import { renderMarkdown } from "@/lib/markdown";

export default function RangeSummary({
  range,
  offset,
  initialSummary,
  hasEntries,
}: {
  range: "week" | "month";
  offset: number;
  initialSummary: string | null;
  hasEntries: boolean;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerating] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startGenerating(async () => {
      const result = await generateRangeSummary(range, offset);
      if (result.error) setError(result.error);
      if (result.summary) setSummary(result.summary);
    });
  };

  return (
    <section className="card px-6 py-5 rise rise-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold tracking-wider stamp-dot">
          AIのふりかえり
        </h3>
        {hasEntries && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="btn-ghost"
          >
            {generating
              ? "読み返しています…"
              : summary
                ? "作り直す"
                : "まとめてもらう"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-shu mb-2">{error}</p>}
      {summary ? (
        <div
          className="review-body text-[0.95rem]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
        />
      ) : (
        !generating && (
          <p className="text-sm text-ink-faint leading-relaxed">
            {hasEntries
              ? "「まとめてもらう」を押すと、この期間のうまくいったこと・学び・目標をAIが分析して振り返りをまとめます。"
              : "この期間の日記が記帳されると、AIによる振り返りが使えます。"}
          </p>
        )
      )}
    </section>
  );
}
