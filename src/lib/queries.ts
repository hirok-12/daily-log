import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { aiSummaries, entries, goalCheckins, goals } from "@/db/schema";
import { getDb } from "@/lib/db";
import { addDays, todayJst } from "@/lib/dates";

export async function getEntryByDate(date: string) {
  const db = await getDb();
  return db.query.entries.findFirst({ where: eq(entries.date, date) });
}

export async function getEntriesInRange(start: string, end: string) {
  const db = await getDb();
  return db.query.entries.findMany({
    where: and(gte(entries.date, start), lte(entries.date, end)),
    orderBy: asc(entries.date),
  });
}

export async function getAllEntryDates(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ date: entries.date })
    .from(entries)
    .orderBy(desc(entries.date));
  return rows.map((r) => r.date);
}

/** 連続記録日数（今日または昨日から遡って数える） */
export async function getStreak(): Promise<number> {
  const dates = new Set(await getAllEntryDates());
  const today = todayJst();
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function getGoalsByDate(date: string) {
  const db = await getDb();
  return db.query.goals.findMany({
    where: and(eq(goals.targetDate, date), eq(goals.scope, "day")),
    orderBy: asc(goals.id),
  });
}

export async function getAllGoals() {
  const db = await getDb();
  return db.query.goals.findMany({ orderBy: desc(goals.targetDate) });
}

export async function getGoalsInRange(start: string, end: string) {
  const db = await getDb();
  return db.query.goals.findMany({
    where: and(gte(goals.targetDate, start), lte(goals.targetDate, end)),
    orderBy: asc(goals.targetDate),
  });
}

export async function getAiSummary(rangeType: string, startDate: string) {
  const db = await getDb();
  return db.query.aiSummaries.findFirst({
    where: and(
      eq(aiSummaries.rangeType, rangeType),
      eq(aiSummaries.startDate, startDate)
    ),
  });
}

/** 指定月の月間目標 (month: YYYY-MM) */
export async function getMonthlyGoals(month: string) {
  const db = await getDb();
  return db.query.goals.findMany({
    where: and(
      eq(goals.scope, "month"),
      gte(goals.targetDate, `${month}-01`),
      lte(goals.targetDate, `${month}-31`)
    ),
    orderBy: asc(goals.id),
  });
}

/** 複数目標のデイリーチェックイン一覧（日付昇順） */
export async function getCheckinsForGoals(goalIds: number[]) {
  if (goalIds.length === 0) return [];
  const db = await getDb();
  return db.query.goalCheckins.findMany({
    where: inArray(goalCheckins.goalId, goalIds),
    orderBy: asc(goalCheckins.date),
  });
}
