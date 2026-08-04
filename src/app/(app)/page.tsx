import EntryForm from "@/components/EntryForm";
import GoalItem from "@/components/GoalItem";
import { formatJa, todayJst } from "@/lib/dates";
import {
  getEntryByDate,
  getGoalsByDate,
  getMonthlyGoals,
  getStreak,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = todayJst();
  const [entry, streak, todaysGoals, monthlyGoals] = await Promise.all([
    getEntryByDate(today),
    getStreak(),
    getGoalsByDate(today),
    getMonthlyGoals(today.slice(0, 7)),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between rise">
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-faint mb-1">TODAY</p>
          <h2 className="font-display text-3xl font-bold tracking-wider">
            {formatJa(today)}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-[0.3em] text-ink-faint mb-1">継続</p>
          <p className="font-display text-3xl font-bold text-shu">
            {streak}
            <span className="text-sm text-ink-soft ml-1">日</span>
          </p>
        </div>
      </div>

      {monthlyGoals.length > 0 && (
        <section className="card px-6 py-5 rise rise-1 border-l-2 border-l-kin">
          <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
            今月の目標
          </h3>
          <ul className="space-y-3">
            {monthlyGoals.map((goal) => (
              <li key={goal.id}>
                <GoalItem goal={goal} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {todaysGoals.length > 0 && (
        <section className="card px-6 py-5 rise rise-1 border-l-2 border-l-shu">
          <h3 className="font-display font-bold tracking-wider mb-3 stamp-dot">
            今日の目標
          </h3>
          <ul className="space-y-3">
            {todaysGoals.map((goal) => (
              <li key={goal.id}>
                <GoalItem goal={goal} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <EntryForm date={today} entry={entry} />
    </div>
  );
}
