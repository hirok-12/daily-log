import Link from "next/link";
import { notFound } from "next/navigation";
import EntryForm from "@/components/EntryForm";
import GoalItem from "@/components/GoalItem";
import { addDays, formatJa, todayJst } from "@/lib/dates";
import { getEntryByDate, getGoalsByDate } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const today = todayJst();
  if (date > today) notFound();

  const [entry, dayGoals] = await Promise.all([
    getEntryByDate(date),
    getGoalsByDate(date),
  ]);

  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between rise">
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-faint mb-1">
            {date === today ? "TODAY" : "ARCHIVE"}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-wider">
            {formatJa(date)}
          </h2>
        </div>
        <div className="flex gap-2">
          <Link href={`/entries/${prev}`} className="btn-ghost">
            ← 前日
          </Link>
          {next <= today && (
            <Link href={`/entries/${next}`} className="btn-ghost">
              翌日 →
            </Link>
          )}
        </div>
      </div>

      {dayGoals.length > 0 && (
        <section className="card px-6 py-5 rise rise-1 border-l-2 border-l-shu">
          <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
            この日の目標
          </h3>
          <ul className="space-y-3">
            {dayGoals.map((goal) => (
              <li key={goal.id}>
                <GoalItem goal={goal} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <EntryForm date={date} entry={entry} />
    </div>
  );
}
