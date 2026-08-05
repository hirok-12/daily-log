import GoalItem from "@/components/GoalItem";
import { addGoal, addMonthlyGoal } from "@/app/actions";
import { addDays, formatJa, formatMonthJa, todayJst } from "@/lib/dates";
import { getAllGoals, getCheckinsForGoals } from "@/lib/queries";
import type { Goal } from "@/db/schema";

export const dynamic = "force-dynamic";

function goalDateLabel(goal: Goal): string {
  return goal.scope === "month"
    ? `${formatMonthJa(goal.targetDate.slice(0, 7))}の目標`
    : formatJa(goal.targetDate);
}

export default async function GoalsPage() {
  const today = todayJst();
  const thisMonth = today.slice(0, 7);
  const allGoals = await getAllGoals();
  const checkins = await getCheckinsForGoals(
    allGoals.filter((g) => g.scope === "month").map((g) => g.id)
  );

  // 月間目標は月が終わるまで「これから」に置く
  const isUpcoming = (g: Goal) =>
    g.scope === "month"
      ? g.targetDate.slice(0, 7) >= thisMonth
      : g.targetDate >= today;

  const upcoming = allGoals
    .filter(isUpcoming)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const past = allGoals.filter((g) => !isUpcoming(g));

  const judged = allGoals.filter((g) => g.result !== "pending");
  const doneCount = allGoals.filter((g) => g.result === "done").length;
  const partialCount = allGoals.filter((g) => g.result === "partial").length;
  const rate =
    judged.length > 0
      ? Math.round(((doneCount + partialCount * 0.5) / judged.length) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between rise">
        <h2 className="font-display text-3xl font-bold tracking-wider">目標</h2>
        {rate !== null && (
          <div className="text-right">
            <p className="text-xs tracking-[0.3em] text-ink-faint mb-1">達成率</p>
            <p className="font-display text-3xl font-bold text-matcha">
              {rate}
              <span className="text-sm text-ink-soft ml-1">%</span>
            </p>
          </div>
        )}
      </div>

      <section className="card px-6 py-5 rise rise-1">
        <h3 className="font-display font-bold tracking-wider mb-4 stamp-dot">
          明日の目標を立てる
        </h3>
        <form action={addGoal} className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            name="targetDate"
            defaultValue={addDays(today, 1)}
            required
            className="field sm:max-w-44"
          />
          <input
            type="text"
            name="title"
            placeholder="例）meetupで一人と連絡先交換する"
            required
            className="field flex-1"
          />
          <button type="submit" className="btn-primary justify-center shrink-0">
            立てる
          </button>
        </form>
      </section>

      <section className="card px-6 py-5 rise rise-2">
        <h3 className="font-display font-bold tracking-wider mb-4 stamp-dot">
          今月の目標を立てる
        </h3>
        <form action={addMonthlyGoal} className="flex flex-col sm:flex-row gap-3">
          <input
            type="month"
            name="targetMonth"
            defaultValue={thisMonth}
            required
            className="field sm:max-w-44"
          />
          <input
            type="text"
            name="title"
            placeholder="例）本を2冊読み切る"
            required
            className="field flex-1"
          />
          <button type="submit" className="btn-primary justify-center shrink-0">
            立てる
          </button>
        </form>
      </section>

      <section className="space-y-3 rise rise-3">
        <h3 className="font-display font-bold tracking-wider stamp-dot">
          これから
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-faint py-4">
            予定されている目標はありません
          </p>
        ) : (
          upcoming.map((goal) => (
            <div key={goal.id} className="card px-6 py-4">
              <GoalItem
                goal={goal}
                dateLabel={goalDateLabel(goal)}
                checkins={checkins.filter((c) => c.goalId === goal.id)}
                todayDate={
                  goal.scope === "month" &&
                  goal.targetDate.slice(0, 7) === thisMonth
                    ? today
                    : undefined
                }
              />
            </div>
          ))
        )}
      </section>

      <section className="space-y-3 rise rise-4">
        <h3 className="font-display font-bold tracking-wider stamp-dot">
          これまで
        </h3>
        {past.length === 0 ? (
          <p className="text-sm text-ink-faint py-4">まだ記録がありません</p>
        ) : (
          past.map((goal) => (
            <div key={goal.id} className="card px-6 py-4">
              <GoalItem
                goal={goal}
                dateLabel={goalDateLabel(goal)}
                showResultLabel
                checkins={checkins.filter((c) => c.goalId === goal.id)}
              />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
