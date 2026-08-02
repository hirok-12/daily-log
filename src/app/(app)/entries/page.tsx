import Link from "next/link";
import {
  addMonths,
  dayOfWeek,
  daysInMonth,
  todayJst,
  WEEKDAY_JA,
} from "@/lib/dates";
import { getEntriesInRange } from "@/lib/queries";

export const dynamic = "force-dynamic";

function firstLine(text: string): string {
  const line = text.split("\n").find((l) => l.trim());
  return line?.trim() ?? "";
}

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const today = todayJst();
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : today.slice(0, 7);

  const days = daysInMonth(month);
  const monthEntries = await getEntriesInRange(days[0], days[days.length - 1]);
  const entryDates = new Set(monthEntries.map((e) => e.date));

  const [year, m] = month.split("-").map(Number);
  const leadingBlanks = dayOfWeek(days[0]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between rise">
        <h2 className="font-display text-3xl font-bold tracking-wider">
          {year}年{m}月
        </h2>
        <div className="flex gap-2">
          <Link href={`/entries?month=${addMonths(month, -1)}`} className="btn-ghost">
            ← 前月
          </Link>
          <Link href={`/entries?month=${addMonths(month, 1)}`} className="btn-ghost">
            翌月 →
          </Link>
        </div>
      </div>

      <section className="card px-6 py-6 rise rise-1">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_JA.map((w, i) => (
            <div
              key={w}
              className={`text-xs pb-2 tracking-widest ${
                i === 0 ? "text-shu" : i === 6 ? "text-matcha" : "text-ink-faint"
              }`}
            >
              {w}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((date) => {
            const has = entryDates.has(date);
            const isToday = date === today;
            const isFuture = date > today;
            const day = Number(date.slice(-2));
            return (
              <Link
                key={date}
                href={isFuture ? "#" : `/entries/${date}`}
                className={`aspect-square flex flex-col items-center justify-center rounded-sm text-sm transition-colors ${
                  isFuture
                    ? "text-ink-faint/40 pointer-events-none"
                    : has
                      ? "bg-matcha-soft text-ink hover:bg-washi-deep"
                      : "text-ink-soft hover:bg-washi-deep"
                } ${isToday ? "outline outline-1 outline-shu" : ""}`}
              >
                <span>{day}</span>
                {has && <span className="w-1 h-1 rounded-full bg-shu mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 rise rise-2">
        {monthEntries.length === 0 ? (
          <p className="text-sm text-ink-faint text-center py-8">
            この月の記録はまだありません
          </p>
        ) : (
          [...monthEntries].reverse().map((entry) => (
            <Link
              key={entry.date}
              href={`/entries/${entry.date}`}
              className="card block px-6 py-4 hover:border-shu transition-colors group"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display font-bold tracking-wider shrink-0">
                  {Number(entry.date.slice(8))}日
                  <span className="text-xs text-ink-faint ml-2">
                    {WEEKDAY_JA[dayOfWeek(entry.date)]}
                  </span>
                </span>
                <span className="text-sm text-ink-soft truncate">
                  {firstLine(entry.wins) ||
                    firstLine(entry.learnings) ||
                    "（本文なし）"}
                </span>
                {entry.aiReview && (
                  <span className="text-[10px] text-shu border border-shu rounded-full px-2 py-0.5 shrink-0 tracking-wider">
                    レビュー済
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
