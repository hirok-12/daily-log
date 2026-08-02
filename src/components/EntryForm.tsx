"use client";

import { useState, useTransition } from "react";
import { generateAiReview, saveEntry } from "@/app/actions";
import { renderMarkdown } from "@/lib/markdown";
import type { Entry } from "@/db/schema";

const SECTIONS: {
  name: keyof Pick<
    Entry,
    "wins" | "gratitude" | "health" | "social" | "selfTalk" | "learnings"
  >;
  no: string;
  label: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    name: "wins",
    no: "一",
    label: "今日うまくいったこと",
    placeholder: "小さなことでOK。3つ書けたら上出来",
    rows: 3,
  },
  {
    name: "gratitude",
    no: "二",
    label: "感謝ポイント",
    placeholder: "ありがたいと感じた人・出来事",
    rows: 3,
  },
  {
    name: "health",
    no: "三",
    label: "健康のためにやったこと",
    placeholder: "散歩、ランニング、早寝…",
    rows: 2,
  },
  {
    name: "social",
    no: "四",
    label: "人間関係・社会とのつながり",
    placeholder: "会った人、話したこと、参加したこと",
    rows: 2,
  },
  {
    name: "selfTalk",
    no: "五",
    label: "自分を責めたことは？",
    placeholder:
      "責めた言葉と、本当にそう言い切れるか？の検討も書いてみる。なければ「なし」",
    rows: 3,
  },
  {
    name: "learnings",
    no: "六",
    label: "今日の学び",
    placeholder: "気づき・考えたこと・切り替えられたこと",
    rows: 4,
  },
];

export default function EntryForm({
  date,
  entry,
}: {
  date: string;
  entry: Entry | undefined;
}) {
  const [saved, setSaved] = useState(false);
  const [review, setReview] = useState(entry?.aiReview ?? null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [reviewing, startReviewing] = useTransition();

  const handleSave = (formData: FormData) => {
    startSaving(async () => {
      await saveEntry(date, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleReview = () => {
    setReviewError(null);
    startReviewing(async () => {
      const result = await generateAiReview(date);
      if (result.error) setReviewError(result.error);
      if (result.review) setReview(result.review);
    });
  };

  return (
    <div className="space-y-6">
      <form action={handleSave} className="space-y-6">
        {SECTIONS.map((section, i) => (
          <section key={section.name} className={`card px-6 py-5 rise rise-${i + 1}`}>
            <label className="block">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-display text-shu text-sm">{section.no}</span>
                <span className="font-display font-bold tracking-wider">
                  {section.label}
                </span>
              </div>
              <textarea
                name={section.name}
                rows={section.rows}
                defaultValue={entry?.[section.name] ?? ""}
                placeholder={section.placeholder}
                className="field"
              />
            </label>
          </section>
        ))}

        <div className="flex items-center gap-4 rise rise-6">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "記帳中…" : "記帳する"}
          </button>
          {saved && (
            <span className="text-sm text-matcha tracking-wider">
              ✓ 保存しました
            </span>
          )}
        </div>
      </form>

      <section className="card px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold tracking-wider stamp-dot">
            カウンセラーのことば
          </h2>
          <button
            type="button"
            onClick={handleReview}
            disabled={reviewing}
            className="btn-ghost"
          >
            {reviewing ? "耳を傾けています…" : review ? "もう一度きく" : "きいてみる"}
          </button>
        </div>
        {reviewError && <p className="text-sm text-shu mb-2">{reviewError}</p>}
        {review ? (
          <div
            className="review-body text-[0.95rem]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(review) }}
          />
        ) : (
          !reviewing && (
            <p className="text-sm text-ink-faint leading-relaxed">
              日記を保存してから「きいてみる」を押すと、カウンセラー視点のレビューが届きます。
            </p>
          )
        )}
      </section>
    </div>
  );
}
