import Link from "next/link";
import { resolveReviewRange, todayJst } from "@/lib/dates";
import { getAiSummary, getEntriesInRange, getGoalsInRange } from "@/lib/queries";
import { RESULT_LABEL } from "@/components/GoalItem";
import RangeSummary from "@/components/RangeSummary";
import type { GoalResult } from "@/db/schema";

export const dynamic = "force-dynamic";

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-・*\s]+/, "").trim())
    .filter(Boolean);
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const range = params.range === "month" ? "month" : "week";
  const offset = Number.parseInt(params.offset ?? "0", 10) || 0;
  const today = todayJst();

  const { start, end, title } = resolveReviewRange(range, offset, today);

  const [rangeEntries, rangeGoals, aiSummary] = await Promise.all([
    getEntriesInRange(start, end),
    getGoalsInRange(start, end),
    getAiSummary(range, start),
  ]);

  const allWins = rangeEntries.flatMap((e) => lines(e.wins));
  const allLearnings = rangeEntries.flatMap((e) => lines(e.learnings));
  const allGratitude = rangeEntries.flatMap((e) => lines(e.gratitude));
  const healthDays = rangeEntries.filter((e) => e.health.trim()).length;
  const socialDays = rangeEntries.filter((e) => e.social.trim()).length;

  const judgedGoals = rangeGoals.filter((g) => g.result !== "pending");
  const doneCount = rangeGoals.filter((g) => g.result === "done").length;

  const tab = (r: string, label: string) => (
    <Link
      href={`/review?range=${r}`}
      className={`px-5 py-2 text-sm tracking-[0.15em] border-b-2 transition-colors ${
        range === r
          ? "border-shu text-ink font-bold"
          : "border-transparent text-ink-faint hover:text-ink-soft"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-8">
      <div className="rise">
        <div className="flex border-b border-line mb-6">
          {tab("week", "週次")}
          {tab("month", "月次")}
        </div>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold tracking-wider">
            {title}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/review?range=${range}&offset=${offset - 1}`}
              className="btn-ghost"
            >
              ←
            </Link>
            {offset < 0 && (
              <Link
                href={`/review?range=${range}&offset=${offset + 1}`}
                className="btn-ghost"
              >
                →
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 rise rise-1">
        {[
          { label: "記録した日", value: rangeEntries.length, unit: "日" },
          { label: "健康の行動", value: healthDays, unit: "日" },
          { label: "つながり", value: socialDays, unit: "日" },
          {
            label: "目標達成",
            value: judgedGoals.length ? `${doneCount}/${judgedGoals.length}` : "—",
            unit: "",
          },
        ].map((stat) => (
          <div key={stat.label} className="card px-4 py-5 text-center">
            <p className="text-[11px] tracking-[0.2em] text-ink-faint mb-2">
              {stat.label}
            </p>
            <p className="font-display text-2xl font-bold">
              {stat.value}
              {stat.unit && (
                <span className="text-xs text-ink-soft ml-1">{stat.unit}</span>
              )}
            </p>
          </div>
        ))}
      </section>

      <RangeSummary
        key={`${range}-${start}`}
        range={range}
        offset={offset}
        initialSummary={aiSummary?.content ?? null}
        hasEntries={rangeEntries.length > 0}
      />

      {rangeEntries.length === 0 ? (
        <p className="text-sm text-ink-faint text-center py-10 rise rise-3">
          この期間の記録はありません
        </p>
      ) : (
        <>
          <section className="card px-6 py-5 rise rise-2">
            <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
              うまくいったこと {allWins.length > 0 && `（${allWins.length}）`}
            </h3>
            <ul className="space-y-1.5">
              {allWins.map((win, i) => (
                <li key={i} className="text-[0.95rem] leading-relaxed flex gap-2">
                  <span className="text-matcha shrink-0">◦</span>
                  {win}
                </li>
              ))}
              {allWins.length === 0 && (
                <p className="text-sm text-ink-faint">記載なし</p>
              )}
            </ul>
          </section>

          <section className="card px-6 py-5 rise rise-3">
            <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
              学び
            </h3>
            <ul className="space-y-1.5">
              {allLearnings.map((learning, i) => (
                <li key={i} className="text-[0.95rem] leading-relaxed flex gap-2">
                  <span className="text-shu shrink-0">◦</span>
                  {learning}
                </li>
              ))}
              {allLearnings.length === 0 && (
                <p className="text-sm text-ink-faint">記載なし</p>
              )}
            </ul>
          </section>

          <section className="card px-6 py-5 rise rise-4">
            <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
              感謝
            </h3>
            <ul className="space-y-1.5">
              {allGratitude.map((g, i) => (
                <li key={i} className="text-[0.95rem] leading-relaxed flex gap-2">
                  <span className="text-kin shrink-0">◦</span>
                  {g}
                </li>
              ))}
              {allGratitude.length === 0 && (
                <p className="text-sm text-ink-faint">記載なし</p>
              )}
            </ul>
          </section>

          {rangeGoals.length > 0 && (
            <section className="card px-6 py-5 rise rise-5">
              <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
                目標のふりかえり
              </h3>
              <ul className="space-y-2">
                {rangeGoals.map((goal) => (
                  <li key={goal.id} className="flex items-baseline gap-3">
                    <span
                      className={`font-display shrink-0 ${
                        goal.result === "done"
                          ? "text-matcha"
                          : goal.result === "partial"
                            ? "text-kin"
                            : goal.result === "missed"
                              ? "text-shu"
                              : "text-ink-faint"
                      }`}
                    >
                      {RESULT_LABEL[goal.result as GoalResult]}
                    </span>
                    <span className="text-xs text-ink-faint shrink-0">
                      {goal.targetDate.slice(5).replace("-", "/")}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[0.95rem]">{goal.title}</span>
                      {goal.note && (
                        <p className="text-xs text-ink-soft mt-0.5">
                          {goal.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
